# Cravio Mobile — local setup

Expo / React Native app. See `CLAUDE.md` in this folder for conventions/architecture, and `/docs/dev-setup.md` for one-time machine prerequisites.

## 1. Install dependencies

```bash
cd mobile
npm install
```

## 2. Run it

```bash
npm start          # Expo dev server — scan the QR code with the Expo Go app on your phone
npm run android     # build + launch on a connected device/emulator (needs Android Studio)
npm run ios         # build + launch on iOS simulator (needs a Mac + Xcode — not available on Windows)
```

Easiest path on Windows with no emulator set up yet: `npm start`, then scan the QR code with **Expo Go** on a physical Android/iOS phone.

If you do want a local Android emulator: install Android Studio, create a virtual device via its Device Manager, start it, then `npm run android`.

## 3. Talking to the API

The app expects the API (see `/api/README.md`) running locally at `http://localhost:8000` (see `src/api/client.ts`). Start that first if you want screens that hit real endpoints — most current screens (Onboarding, Discover, Campaigns, Builder, Portfolio) still render from local demo data in `src/data/demo.ts` until their feature cards (A2, A4, D3, C2, E1, E3 in `/docs/P0-task-cards.md`) wire them to the API.

If you change `/docs/openapi.yaml` (i.e. the API's routes/schemas changed), regenerate the typed client:

```bash
npm run generate:api
```

This writes `src/api/openapi.d.ts` — never hand-edit that file.

## 4. Tests, lint, typecheck

```bash
npm test            # jest
npm run lint        # eslint (.ts/.tsx + .js)
npx tsc --noEmit    # typecheck
```

CI (`.github/workflows/ci.yml`) runs `npm install`, `npm run lint`, and `npm test` on every PR that touches `mobile/**`.

## Project layout

```
mobile/
  App.tsx                 # entry point
  src/
    theme/                 # design tokens synced from Claude Design (colors, type, spacing, radius, elevation) + ThemeProvider
    components/             # design-system component library (Button, Card, InfluencerCard, ...)
    screens/                 # Onboarding, Discover, Campaigns, Builder, Portfolio, Messages
    navigation/              # RootNavigator — onboarding gate -> bottom tabs -> modal builder
    api/                     # generated client (openapi.d.ts) + thin wrapper (client.ts)
    data/                    # local demo data used by screens until they're wired to the API
```

## Troubleshooting

- **Metro bundler errors after pulling new dependencies** — stop the dev server, `rm -rf node_modules`, `npm install`, restart.
- **Expo Go can't reach the dev server** — phone and computer must be on the same network; if it still fails, run `npm start -- --tunnel`.
- **Typed API client looks stale after an API change** — re-run `npm run generate:api`; the file is generated, not hand-maintained.
- **`npm run ios` fails on Windows** — expected; iOS builds need macOS + Xcode. Use Expo Go or EAS cloud build instead (see `/docs/dev-setup.md`).
