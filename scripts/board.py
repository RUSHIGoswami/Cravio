#!/usr/bin/env python3
"""Cravio GitHub Projects board toolkit.

One source of truth for *structure* is docs/backlog.yaml (cards + dependencies).
One source of truth for *status* is the GitHub Projects board ("Status" field:
Not started / Active / Released).

Commands
--------
  python scripts/board.py setup     Create labels, issues, and the project board
                                     from backlog.yaml. Idempotent: safe to re-run.
  python scripts/board.py next      Read live board status + deps and print the
                                     cards that are unblocked and ready to start.
  python scripts/board.py status    Print every card grouped by board column.

Requirements
------------
  - GitHub CLI installed and authenticated:  gh auth login
  - Project scope granted:                    gh auth refresh -s project --hostname github.com
  - PyYAML:                                   pip install pyyaml
"""

from __future__ import annotations

import json
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

# Board column names -> the meaning we use in the resolver.
DONE_NAMES = {"Released", "Done"}
ACTIVE_NAMES = {"Active", "In Progress"}
# When setup runs, built-in options are still Todo/In Progress/Done.
# We map our column names onto whatever the project currently has.
COLUMN_ALIASES = {
    "Not started": ["Not started", "Todo", "To do"],
    "Active": ["Active", "In Progress"],
    "Released": ["Released", "Done"],
}


# --------------------------------------------------------------------------- #
# gh helpers
# --------------------------------------------------------------------------- #
def gh(*args: str, check: bool = True, capture: bool = True) -> str:
    """Run a gh command, return stdout."""
    proc = subprocess.run(
        ["gh", *args],
        text=True,
        capture_output=capture,
    )
    if check and proc.returncode != 0:
        sys.exit(f"gh {' '.join(args)}\n{proc.stderr.strip()}")
    return (proc.stdout or "").strip()


def gh_json(*args: str):
    return json.loads(gh(*args))


def preflight() -> None:
    if subprocess.run(["gh", "--version"], capture_output=True).returncode != 0:
        sys.exit("GitHub CLI not found. Install it: https://cli.github.com/")
    if subprocess.run(["gh", "auth", "status"], capture_output=True).returncode != 0:
        sys.exit("Not logged in. Run:  gh auth login")


def load_backlog() -> dict:
    with open(BACKLOG, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def card_title(card: dict) -> str:
    return f"{card['id']} · {card['title']}"


def card_id_from_title(title: str) -> str | None:
    token = title.split("·", 1)[0].strip() if "·" in title else title.split()[0]
    return token or None


# --------------------------------------------------------------------------- #
# setup
# --------------------------------------------------------------------------- #
def ensure_labels(cards: list[dict]) -> None:
    labels = sorted({lbl for c in cards for lbl in c.get("labels", [])})
    print(f"Ensuring {len(labels)} labels ...")
    for lbl in labels:
        subprocess.run(
            ["gh", "label", "create", lbl, "--force"],
            capture_output=True, text=True,
        )


def existing_issue_numbers(repo: str) -> dict[str, dict]:
    """Map card id -> issue dict, for issues already created by this tool."""
    items = gh_json(
        "issue", "list", "--repo", repo, "--state", "all", "--limit", "300",
        "--json", "number,title,url",
    )
    out = {}
    for it in items:
        cid = card_id_from_title(it["title"])
        if cid:
            out[cid] = it
    return out


def ensure_issues(repo: str, cards: list[dict]) -> dict[str, dict]:
    existing = existing_issue_numbers(repo)
    result: dict[str, dict] = {}
    for card in cards:
        cid = card["id"]
        if cid in existing:
            result[cid] = existing[cid]
            continue
        deps = ", ".join(card.get("depends_on", [])) or "none"
        pkgs = ", ".join(card.get("package", []))
        body = (
            f"{card['body'].strip()}\n\n"
            f"**Package:** {pkgs}\n"
            f"**Depends on:** {deps}\n\n"
            f"Full acceptance criteria: [`{CARDS_DOC}`](../blob/main/{CARDS_DOC}) "
            f"(card {cid})."
        )
        label_args: list[str] = []
        for lbl in card.get("labels", []):
            label_args += ["--label", lbl]
        url = gh(
            "issue", "create", "--repo", repo,
            "--title", card_title(card),
            "--body", body,
            *label_args,
        )
        url = url.splitlines()[-1].strip()
        print(f"  created {cid}: {url}")
        result[cid] = {"url": url, "title": card_title(card)}
    return result


def ensure_project(meta: dict) -> dict:
    title = meta["project_title"]
    projects = gh_json("project", "list", "--owner", "@me", "--format", "json")["projects"]
    for p in projects:
        if p["title"] == title:
            return p
    print(f"Creating project: {title}")
    gh("project", "create", "--owner", "@me", "--title", title)
    projects = gh_json("project", "list", "--owner", "@me", "--format", "json")["projects"]
    for p in projects:
        if p["title"] == title:
            return p
    sys.exit("Project creation failed.")


def status_field(project_number: int) -> dict:
    fields = gh_json(
        "project", "field-list", str(project_number),
        "--owner", "@me", "--format", "json",
    )["fields"]
    for f in fields:
        if f["name"] == "Status":
            return f
    sys.exit("No 'Status' field on the project (unexpected for a new Projects v2 board).")


def option_id(field: dict, column: str) -> str | None:
    by_name = {o["name"]: o["id"] for o in field.get("options", [])}
    for alias in COLUMN_ALIASES[column]:
        if alias in by_name:
            return by_name[alias]
    return None


def add_items_and_set_status(project: dict, field: dict, cards: list[dict],
                             issues: dict[str, dict], released: set[str]) -> None:
    pid = project["id"]
    pnum = project["number"]
    items = gh_json("project", "item-list", str(pnum), "--owner", "@me",
                    "--format", "json")["items"]
    item_by_card = {}
    for it in items:
        content = it.get("content") or {}
        cid = card_id_from_title(content.get("title", ""))
        if cid:
            item_by_card[cid] = it

    for card in cards:
        cid = card["id"]
        if cid not in item_by_card:
            url = issues[cid]["url"]
            out = gh_json("project", "item-add", str(pnum), "--owner", "@me",
                          "--url", url, "--format", "json")
            item_by_card[cid] = out
            print(f"  added {cid} to board")

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
    print("  initial statuses set (released cards -> Released, rest -> Not started)")


def cmd_setup() -> None:
    preflight()
    data = load_backlog()
    meta, cards = data["meta"], data["cards"]
    repo = meta["repo"]
    released = set(meta.get("released", []))

    ensure_labels(cards)
    issues = ensure_issues(repo, cards)
    project = ensure_project(meta)
    field = status_field(project["number"])
    add_items_and_set_status(project, field, cards, issues, released)

    print("\n✅ Board ready:", project.get("url", f"project #{project['number']}"))
    print(textwrap_dedent_checklist())


def textwrap_dedent_checklist() -> str:
    return (
        "\nOne-time UI polish (≈1 min, makes 'Released' automatic):\n"
        "  1. Open the project → board view → group by Status.\n"
        "  2. Rename the columns if needed: Todo→Not started, In Progress→Active,\n"
        "     Done→Released. (Renaming keeps option IDs, so set statuses persist.)\n"
        "  3. Project ▸ ⋯ ▸ Workflows: enable 'When issue is closed → set Status =\n"
        "     Released'. Then any PR that says 'Closes #<n>' moves its card on merge.\n"
        "  4. Optional: enable 'When issue is reopened → Active'.\n"
    )


# --------------------------------------------------------------------------- #
# next / status
# --------------------------------------------------------------------------- #
def read_board(meta: dict) -> dict[str, str]:
    """Return card_id -> column name, from live board status."""
    projects = gh_json("project", "list", "--owner", "@me", "--format", "json")["projects"]
    proj = next((p for p in projects if p["title"] == meta["project_title"]), None)
    if not proj:
        sys.exit("Board not found. Run:  python scripts/board.py setup")
    items = gh_json("project", "item-list", str(proj["number"]), "--owner", "@me",
                    "--format", "json")["items"]
    out: dict[str, str] = {}
    for it in items:
        content = it.get("content") or {}
        cid = card_id_from_title(content.get("title", ""))
        if not cid:
            continue
        out[cid] = it.get("status") or "Not started"
    return out


def cmd_next() -> None:
    preflight()
    data = load_backlog()
    cards = {c["id"]: c for c in data["cards"]}
    board = read_board(data["meta"])

    def is_done(cid: str) -> bool:
        return board.get(cid, "Not started") in DONE_NAMES

    active = [c for cid, c in cards.items() if board.get(cid) in ACTIVE_NAMES]
    ready = []
    for cid, c in cards.items():
        if is_done(cid) or board.get(cid) in ACTIVE_NAMES:
            continue
        if all(is_done(d) for d in c.get("depends_on", [])):
            ready.append(c)

    done_n = sum(1 for cid in cards if is_done(cid))
    print(f"\nProgress: {done_n}/{len(cards)} cards Released.\n")

    if active:
        print("In progress:")
        for c in active:
            print(f"  ~ {card_title(c)}")
        print()

    if not ready:
        print("Nothing unblocked. Finish an in-progress card to open the next ones.")
        return
    print("Ready to start (all dependencies Released):")
    for c in sorted(ready, key=lambda c: c["id"]):
        deps = ", ".join(c.get("depends_on", [])) or "none"
        print(f"  → {card_title(c)}   [deps: {deps}]")


def cmd_status() -> None:
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
        rows = sorted(buckets[col], key=lambda c: c["id"])
        print(f"\n{col} ({len(rows)})")
        for c in rows:
            print(f"  {card_title(c)}")


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "next"
    if cmd == "setup":
        cmd_setup()
    elif cmd == "next":
        cmd_next()
    elif cmd == "status":
        cmd_status()
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
