# Cravio — Dev Setup Checklist

Install these **before** your first Claude Code session so F1–F2 don't stall on missing prerequisites. Windows-focused (your machine); macOS/Linux notes where they differ. Work top to bottom — each section says why it's needed and how to confirm it works.

## 1. Core tools (needed for F1–F2)

### Git
- You already have it (the repo exists). Confirm: `git --version`.
- Make sure you can push to GitHub (you'll do this in the commit step). If `git push` fails on auth, install **GitHub CLI** (`winget install GitHub.cli`) and run `gh auth login`, or set up a Personal Access Token.

### Node.js (LTS) — needed for Claude Code, the mobile app, and CI's JS tests
- Install the **LTS** version from https://nodejs.org (or `winget install OpenJS.NodeJS.LTS`).
- Confirm: `node --version` (want v20+) and `npm --version`.

### Python 3.12 — the backend language (ADR-0002)
- Install from https://www.python.org/downloads/ (or `winget install Python.Python.3.12`). Check "Add to PATH" during install.
- Confirm: `python --version` shows 3.12.x. (On some setups use `py -3.12 --version`.)

### Docker Desktop — runs local Postgres + Redis for F2 onward (ADR-0003)
- Install from https://www.docker.com/products/docker-desktop (or `winget install Docker.DockerDesktop`).
- On Windows it needs WSL2; the installer will prompt/enable it — follow its steps and reboot if asked.
- Start Docker Desktop and confirm: `docker --version` and `docker run --rm hello-world` succeeds.
- Why: F2 stands up Postgres + Redis via docker-compose so the API and tests have a database locally. Without Docker, F2 stalls.

## 2. Claude Code (run F1–F5 and the P0 cards)
- Install once: `npm install -g @anthropic-ai/claude-code`
- Confirm: `claude --version`. First run (`claude` inside `C:\Career\Cravio`) asks you to sign in.

## 3. Claude Design (parallel design track)
- Access via claude.ai → Labs / the Claude Design app. No local install. You'll paste `docs/design-brief.md`, iterate, then link the GitHub repo and run `/design-sync`.

## 4. Mobile build tooling — needed at F5, NOT before
You can start F1–F4 without these; install before F5 (mobile shell). RN/Expo guides them, but the platforms need:
- **Android:** Android Studio (https://developer.android.com/studio) for the SDK + an emulator. Confirm an emulator boots.
- **iOS:** requires **macOS + Xcode** — not available on Windows. Options: build iOS on a Mac, use Expo's cloud build (EAS) for iOS, or defer iOS device testing. Decide this when you reach F5; Android-first is fine to start.
- Tip: starting with **Expo** (per ADR-0012) lets you preview on a physical phone via the Expo Go app without full native toolchains early on.

## 5. Accounts & credentials — set up the FREE/stub ones now; live keys come later
Everything is **stubbed first** (ADR-0004/0005/0008), so you do NOT need live integration keys for F1–F5 or most P0 build work. Get these moving in parallel because some have lead time:
- **GitHub** — already have it (repo + Actions/CI).
- **Anthropic API key** — for Claude Code and later the AI features (ADR-0007). https://console.anthropic.com
- **Firebase project** — Auth + FCM (ADR-0004/0010). Free to create now: https://console.firebase.google.com
- **AWS account** — S3 + CloudFront (ADR-0006) and infra (ADR-0011/infra). Lead time on verification; start early.
- **Razorpay** — payments/Route (ADR-0005). **Requires a registered legal entity** for live payouts — this is your founder Open Question and has the longest lead time. Code is stubbed, so it won't block building, but start entity formation in parallel.
- **Meta (Instagram) + YouTube Data API** — verified metrics (ADR-0008). App review takes time; register the apps early. Stubbed until approved.
- **PostHog** — analytics (ADR-0011). Free tier; create when you reach L1/instrumentation.

Store every secret in a secret manager / `.env` (never in code or git) — reference key **names** only, per the build conventions.

## Quick verification before session 1
Run these; all should succeed:
```bash
git --version
node --version
npm --version
python --version
docker run --rm hello-world
claude --version
```
If all pass, you're ready to run the **F1** prompt from `docs/claude-code-foundation-prompts.md`.

## What you need at each card (summary)
| Card | Needs ready |
|------|-------------|
| Commit | git + GitHub auth |
| F1 | git, Node, Claude Code |
| F2 | + Python 3.12, Docker |
| F3 | (same as F2) |
| F4 | (same as F2) |
| F5 | + Android Studio (and a Mac/EAS for iOS) |
| A1+ | live integration keys only as each feature goes from stub → live |
