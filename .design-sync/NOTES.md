# Design Sync Notes

## Project
- Claude Design project: "Cravio Design System" (`d69a5151-6f2c-45d6-badd-7a6ab00ee6a2`)
- Created 2026-06-25 via Claude Design (not built from local components)

## Architecture note
Local components in `mobile/src/components/` are **React Native** (not web React).
Claude Design project has **web React** counterparts + design tokens.

The Claude Design project is the SOURCE OF TRUTH for:
- Design tokens (`tokens/*.css`, `export/mobile-theme/*.ts`)
- Web component API contracts (`.d.ts`, `.jsx`, `.prompt.md`)
- Logo assets, guidelines, UI kit screens

## Sync direction
`/design-sync` normally uploads local → Claude Design.
For this repo, the practical flow is:
- Design changes live in Claude Design
- Pull `export/mobile-theme/*.ts` manually into `mobile/src/theme/` when tokens change
- RN components in `mobile/src/components/` stay in sync by convention, not automation

## Future: if uploading local components to Claude Design
Would require web-compatible wrappers (e.g. a shared `/packages/ui-web/` package that
re-exports the same API using DOM equivalents). Not set up yet.
