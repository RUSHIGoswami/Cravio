#!/usr/bin/env python3
"""Cravio GitHub Projects board toolkit.

Structure (cards + dependencies) lives in docs/backlog.yaml.
Status (board column) lives on the GitHub Projects board: Not started/Active/Released.

Commands:
  setup        Create labels, issues, and the project board from backlog.yaml (idempotent).
  next         Print cards whose dependencies are all Released (your "what's next").
  status       Print every card grouped by board column.
  brief ID     Print a paste-ready agent brief for a card. Add --sdd for heavy cards.

Requires: gh (authed, with `gh auth refresh -s project`), and `pip install pyyaml`.
"""
from __future__ import annotations
import json
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("Missing dependency. Run:  pip install pyyaml")

ROOT = Path(__file__).resolve().parent.parent
BACKLOG = ROOT / "docs" / "backlog.yaml"
CARDS_DOC = "docs/P0-task-cards.md"
DOT = "·"  # middle dot in card titles: "A1 · Title"

DONE_NAMES = {"Released", "Done"}
ACTIVE_NAMES = {"Active", "In Progress"}
COLUMN_ALIASES = {
    "Not started": ["Not started", "Todo", "To do"],
    "Active": ["Active", "In Progress"],
    "Released": ["Released", "Done"],
}
ADR_BY_LABEL = {
    "auth": "docs/adr/0004-auth-firebase.md",
    "payments": "docs/adr/0005-payments-razorpay.md",
    "discovery": "docs/adr/0009-search-postgres-algolia.md",
}
ADR_BY_ID = {
    "A3": "docs/adr/0008-social-meta-youtube-api.md",
    "E4": "docs/adr/0006-media-s3-cloudfront.md",
    "G1": "docs/adr/0010-push-fcm.md",
    "L1": "docs/adr/0011-analytics-posthog.md",
}
PROVIDER_BY_LABEL = {
    "auth": ("AuthProvider", "api/app/services/auth/"),
    "payments": ("PaymentProvider", "api/app/services/payment/"),
    "discovery": ("SearchService", "api/app/services/search/"),
}
PROVIDER_BY_ID = {
    "A3": ("VerificationProvider", "api/app/services/verification/"),
    "G1": ("NotificationService", "api/app/services/notification/"),
}


def gh(*args, check=True):
    proc = subprocess.run(["gh", *args], text=True, capture_output=True)
    if check and proc.returncode != 0:
        sys.exit("gh " + " ".join(args) + "\n" + proc.stderr.strip())
    return (proc.stdout or "").strip()


def gh_json(*args):
    return json.loads(gh(*args))


def preflight():
    if subprocess.run(["gh", "--version"], capture_output=True).returncode != 0:
        sys.exit("GitHub CLI not found: https://cli.github.com/")
    if subprocess.run(["gh", "auth", "status"], capture_output=True).returncode != 0:
        sys.exit("Not logged in. Run:  gh auth login")


def load_backlog():
    with open(BACKLOG, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def card_title(card):
    return card["id"] + " " + DOT + " " + card["title"]


def card_id_from_title(title):
    head = title.split(DOT, 1)[0] if DOT in title else title
    parts = head.split()
    return parts[0] if parts else ""


def ensure_labels(cards):
    labels = sorted({lbl for c in cards for lbl in c.get("labels", [])})
    print("Ensuring " + str(len(labels)) + " labels ...")
    for lbl in labels:
        subprocess.run(["gh", "label", "create", lbl, "--force"], capture_output=True, text=True)


def existing_issue_numbers(repo):
    items = gh_json("issue", "list", "--repo", repo, "--state", "all",
                    "--limit", "300", "--json", "number,title,url")
    out = {}
    for it in items:
        cid = card_id_from_title(it["title"])
        if cid:
            out[cid] = it
    return out


def ensure_issues(repo, cards):
    existing = existing_issue_numbers(repo)
    result = {}
    for card in cards:
        cid = card["id"]
        if cid in existing:
            result[cid] = existing[cid]
            continue
        deps = ", ".join(card.get("depends_on", [])) or "none"
        pkgs = ", ".join(card.get("package", []))
        body = (card["body"].strip() + "\n\n**Package:** " + pkgs
                + "\n**Depends on:** " + deps
                + "\n\nFull acceptance criteria: `" + CARDS_DOC + "` (card " + cid + ").")
        label_args = []
        for lbl in card.get("labels", []):
            label_args += ["--label", lbl]
        url = gh("issue", "create", "--repo", repo, "--title", card_title(card),
                 "--body", body, *label_args)
        url = url.splitlines()[-1].strip()
        print("  created " + cid + ": " + url)
        result[cid] = {"url": url, "title": card_title(card)}
    return result


def ensure_project(meta):
    title = meta["project_title"]
    projects = gh_json("project", "list", "--owner", "@me", "--format", "json")["projects"]
    for p in projects:
        if p["title"] == title:
            return p
    print("Creating project: " + title)
    gh("project", "create", "--owner", "@me", "--title", title)
    projects = gh_json("project", "list", "--owner", "@me", "--format", "json")["projects"]
    for p in projects:
        if p["title"] == title:
            return p
    sys.exit("Project creation failed.")


def status_field(project_number):
    fields = gh_json("project", "field-list", str(project_number),
                     "--owner", "@me", "--format", "json")["fields"]
    for f in fields:
        if f["name"] == "Status":
            return f
    sys.exit("No 'Status' field on the project.")


def option_id(field, column):
    by_name = {o["name"]: o["id"] for o in field.get("options", [])}
    for alias in COLUMN_ALIASES[column]:
        if alias in by_name:
            return by_name[alias]
    return None


def add_items_and_set_status(project, field, cards, issues, released):
    pid = project["id"]
    pnum = project["number"]
    items = gh_json("project", "item-list", str(pnum), "--owner", "@me", "--format", "json")["items"]
    item_by_card = {}
    for it in items:
        content = it.get("content") or {}
        cid = card_id_from_title(content.get("title", ""))
        if cid:
            item_by_card[cid] = it
    for card in cards:
        cid = card["id"]
        if cid not in item_by_card:
            out = gh_json("project", "item-add", str(pnum), "--owner", "@me",
                          "--url", issues[cid]["url"], "--format", "json")
            item_by_card[cid] = out
            print("  added " + cid + " to board")
    rel_opt = option_id(field, "Released")
    new_opt = option_id(field, "Not started")
    for card in cards:
        cid = card["id"]
        item_id = item_by_card[cid]["id"]
        target = rel_opt if cid in released else new_opt
        if not target:
            continue
        gh("project", "item-edit", "--id", item_id, "--project-id", pid,
           "--field-id", field["id"], "--single-select-option-id", target)
    print("  initial statuses set (released -> Released, rest -> Not started)")


def setup_checklist():
    return ("\nOne-time UI polish (~1 min, makes 'Released' automatic):\n"
            "  1. Open the project -> board view -> group by Status.\n"
            "  2. Rename columns if needed: Todo->Not started, In Progress->Active, Done->Released.\n"
            "  3. Project menu -> Workflows: enable 'When issue closed -> Status = Released'.\n"
            "     Then any PR that says 'Closes #<n>' moves its card on merge.\n"
            "  4. Optional: enable 'When issue reopened -> Active'.\n")


def cmd_setup():
    preflight()
    data = load_backlog()
    meta, cards = data["meta"], data["cards"]
    released = set(meta.get("released", []))
    ensure_labels(cards)
    issues = ensure_issues(meta["repo"], cards)
    project = ensure_project(meta)
    field = status_field(project["number"])
    add_items_and_set_status(project, field, cards, issues, released)
    print("\nBoard ready: " + project.get("url", "project #" + str(project["number"])))
    print(setup_checklist())


def read_board(meta):
    projects = gh_json("project", "list", "--owner", "@me", "--format", "json")["projects"]
    proj = next((p for p in projects if p["title"] == meta["project_title"]), None)
    if not proj:
        sys.exit("Board not found. Run:  python scripts/board.py setup")
    items = gh_json("project", "item-list", str(proj["number"]), "--owner", "@me", "--format", "json")["items"]
    out = {}
    for it in items:
        content = it.get("content") or {}
        cid = card_id_from_title(content.get("title", ""))
        if cid:
            out[cid] = it.get("status") or "Not started"
    return out


def cmd_next():
    preflight()
    data = load_backlog()
    cards = {c["id"]: c for c in data["cards"]}
    board = read_board(data["meta"])
    done = set(cid for cid in cards if board.get(cid, "Not started") in DONE_NAMES)
    active = [c for cid, c in cards.items() if board.get(cid) in ACTIVE_NAMES]
    ready = []
    for cid, c in cards.items():
        if cid in done or board.get(cid) in ACTIVE_NAMES:
            continue
        if all(d in done for d in c.get("depends_on", [])):
            ready.append(c)
    print("\nProgress: " + str(len(done)) + "/" + str(len(cards)) + " cards Released.\n")
    if active:
        print("In progress:")
        for c in active:
            print("  ~ " + card_title(c))
        print()
    if not ready:
        print("Nothing unblocked. Finish an in-progress card to open the next ones.")
        return
    print("Ready to start (all dependencies Released):")
    for c in sorted(ready, key=lambda x: x["id"]):
        deps = ", ".join(c.get("depends_on", [])) or "none"
        print("  -> " + card_title(c) + "   [deps: " + deps + "]")


def cmd_status():
    preflight()
    data = load_backlog()
    cards = {c["id"]: c for c in data["cards"]}
    board = read_board(data["meta"])
    buckets = {"Released": [], "Active": [], "Not started": []}
    for cid, c in cards.items():
        col = board.get(cid, "Not started")
        if col in DONE_NAMES:
            buckets["Released"].append(c)
        elif col in ACTIVE_NAMES:
            buckets["Active"].append(c)
        else:
            buckets["Not started"].append(c)
    for col in ("Released", "Active", "Not started"):
        rows = sorted(buckets[col], key=lambda x: x["id"])
        print("\n" + col + " (" + str(len(rows)) + ")")
        for c in rows:
            print("  " + card_title(c))


def load_card_specs():
    text = (ROOT / CARDS_DOC).read_text(encoding="utf-8")
    specs = {}
    for part in re.split(r"^### ", text, flags=re.M)[1:]:
        lines = part.splitlines()
        cid = card_id_from_title(lines[0].strip())
        desc, crit, mode = [], [], "desc"
        for ln in lines[1:]:
            s = ln.strip()
            if s.startswith("**Acceptance criteria"):
                mode = "crit"
                continue
            if mode == "desc":
                if s.startswith("**Package") or s.startswith("**Depends"):
                    continue
                if s and not s.startswith(("---", "##")):
                    desc.append(s)
            elif s.startswith("-"):
                crit.append(s[1:].strip())
            elif s.startswith(("##", "---")):
                break
        specs[cid] = {"desc": " ".join(desc).strip(), "criteria": crit}
    return specs


def find_issue(repo, cid):
    try:
        proc = subprocess.run(["gh", "issue", "list", "--repo", repo, "--state", "all",
                               "--search", cid, "--limit", "100", "--json", "number,url,title"],
                              capture_output=True, text=True)
    except FileNotFoundError:
        return None
    if proc.returncode != 0:
        return None
    try:
        for it in json.loads(proc.stdout):
            if card_id_from_title(it.get("title", "")) == cid:
                return it
    except json.JSONDecodeError:
        return None
    return None


def reference_docs(card):
    docs = ["CLAUDE.md"]
    for pkg in card.get("package", []):
        if pkg != "root":
            docs.append(pkg + "/CLAUDE.md")
    for lbl in card.get("labels", []):
        if lbl in ADR_BY_LABEL:
            docs.append(ADR_BY_LABEL[lbl])
    if card["id"] in ADR_BY_ID:
        docs.append(ADR_BY_ID[card["id"]])
    docs.append(CARDS_DOC)
    seen, out = set(), []
    for d in docs:
        if d not in seen:
            seen.add(d)
            out.append(d)
    return out


def provider_hint(card):
    if card["id"] in PROVIDER_BY_ID:
        return PROVIDER_BY_ID[card["id"]]
    for lbl in card.get("labels", []):
        if lbl in PROVIDER_BY_LABEL:
            return PROVIDER_BY_LABEL[lbl]
    return None


def cmd_brief(card_id, sdd=False):
    data = load_backlog()
    cards = {c["id"]: c for c in data["cards"]}
    card = cards.get(card_id)
    if not card:
        sys.exit("Unknown card '" + card_id + "'. Known: " + ", ".join(cards))
    spec = load_card_specs().get(card_id, {"desc": card["body"].strip(), "criteria": []})
    issue = find_issue(data["meta"]["repo"], card_id)
    issue_no = str(issue["number"]) if issue else "<issue>"
    issue_ref = ("#" + str(issue["number"]) + "  " + issue["url"]) if issue else "(open the card's issue on the board)"
    deps = ", ".join(card.get("depends_on", [])) or "none"
    prov = provider_hint(card)
    bar = "=" * 70
    out = [bar, "AGENT BRIEF -- " + card_title(card), "GitHub issue: " + issue_ref,
           "Package: " + ", ".join(card.get("package", [])) + "   |   Depends on: " + deps + " (all must be Released)",
           bar, "", "READ FIRST (in order):"]
    for d in reference_docs(card):
        out.append("  - " + d)
    out += ["", "TASK:", "  " + spec["desc"], "",
            "ACCEPTANCE CRITERIA -- write these as tests FIRST, then implement to green:"]
    if spec["criteria"]:
        for i, c in enumerate(spec["criteria"], 1):
            out.append("  " + str(i) + ". " + c)
    else:
        out.append("  (see the card in docs/P0-task-cards.md)")
    out += ["", "CONVENTIONS (apply throughout):",
            "  - Tests first: the criteria above are the test list; red -> green.",
            "  - Integrations stubbed: build against the deterministic stub; no vendor SDK",
            "    outside its provider module; the per-provider config flag selects stub/live."]
    if prov:
        out.append("  - This card's provider: " + prov[0] + " (extend the stub in " + prov[1] + ").")
    out += ["  - OpenAPI is generated: after adding/altering routes or schemas, run",
            "      cd api && python -m app.scripts.export_openapi",
            "    and commit docs/openapi.yaml (CI fails on drift).",
            "  - Secrets by name only. Use rtk-prefixed commands (see CLAUDE.md).",
            "  - Branch from main; open a PR whose description includes  Closes #" + issue_no,
            "    so merging auto-moves the card to Released.", ""]
    if sdd:
        out += ["SPEC-DECOMPOSITION MODE (heavy card -- plan before coding):",
                "  Produce an SDD plan like .superpowers/sdd/ did for F4:",
                "  1. Decompose into ordered single-responsibility tasks; per task list files to",
                "     touch, interfaces produced/consumed, and a tests-first step list.",
                "  2. Keep a progress ledger; commit per task; review each diff vs criteria.",
                "  3. Only then execute task by task.", ""]
    out += ["STOP when every acceptance criterion is green. Summarize the diff against them.", bar]
    print("\n".join(out))


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "next"
    if cmd == "setup":
        cmd_setup()
    elif cmd == "next":
        cmd_next()
    elif cmd == "status":
        cmd_status()
    elif cmd == "brief":
        args = sys.argv[2:]
        ids = [a for a in args if not a.startswith("--")]
        if not ids:
            sys.exit("Usage: python scripts/board.py brief <CARD_ID> [--sdd]")
        cmd_brief(ids[0].upper(), sdd="--sdd" in args)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
