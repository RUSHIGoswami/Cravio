# Cravio build board

A GitHub Projects Kanban board (**Not started → Active → Released**) driven from
the backlog, so progress is visible at a glance and "what's next" answers itself.

## Two sources of truth, on purpose

- **Structure** (cards + dependencies) lives in [`docs/backlog.yaml`](../docs/backlog.yaml).
- **Status** (which column a card is in) lives on the GitHub Projects board.

Because each P0 card maps to one PR, the board updates itself: a PR that says
`Closes #<issue>` moves its card to **Released** the moment it merges. No manual
bookkeeping.

## One-time setup

```bash
# 1. Authenticate the GitHub CLI (you do this — Claude never handles your token)
gh auth login
gh auth refresh -s project --hostname github.com   # grant the "project" scope

# 2. Build the board (creates labels, ~25 issues, the project, sets statuses)
pip install pyyaml
python scripts/board.py setup
```

`setup` is **idempotent** — re-run it any time you add cards to `backlog.yaml`;
it only creates what's missing. F1–F5 are pre-marked **Released**.

After it runs, do the ~1-minute UI polish it prints: rename the columns to
Not started / Active / Released and turn on the workflow
*"When issue is closed → set Status = Released"*. That's what makes merges
auto-advance the board.

## Daily use — stop asking "what's next"

```bash
python scripts/board.py next      # cards whose dependencies are all Released
python scripts/board.py status    # every card grouped by column
```

### Generate a card's agent brief

Instead of hand-writing a prompt per card, generate it from the backlog + the
card's acceptance criteria on demand:

```bash
python scripts/board.py brief A1          # paste-ready brief for card A1
python scripts/board.py brief A3 --sdd    # add a spec-decomposition plan (heavy cards)
```

The brief assembles: the docs to read (root + package CLAUDE.md + the relevant
ADR), the acceptance criteria as a tests-first list, the provider stub to build
against, the standing conventions, and a `Closes #<issue>` line so the merged PR
auto-advances the board. Paste it into Claude Code as the session task. Nothing
is stored per card — the YAML and P0-task-cards.md stay the only sources.

Typical `next` output right now:

```
Progress: 5/25 cards Released.

Ready to start (all dependencies Released):
  → A1 · Social sign-up + role selection (API)   [deps: F4]
  → L0 · Deploy pipeline                          [deps: F1]
```

## Workflow per card

1. `python scripts/board.py next` → pick a card.
2. Move it to **Active** on the board (or just start; drag it over).
3. Branch, build, open a PR whose description includes `Closes #<issue-number>`.
4. Merge → the card auto-moves to **Released** → `next` shows the newly unblocked cards.

## Adding or changing work

Edit `docs/backlog.yaml` (add a card, change `depends_on`), then re-run
`python scripts/board.py setup`. The board and the resolver both pick it up — the
YAML is the only thing you hand-edit.
