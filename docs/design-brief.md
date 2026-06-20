# Cravio — Brand & Design-System Brief (for Claude Design)

Input brief for generating Cravio's brand identity and React Native design system in Claude Design, then syncing tokens/components into `/mobile` via `/design-sync`. Keep it **lean** — logo, palette, type, and a core component set are the Phase 0 gate (F5); a full brand book can wait until post-revenue.

## What Cravio is
India's commission-free, verified, AI-augmented influencer marketplace connecting brands directly with influencers. Mobile-first (iOS/Android), India-wide from day one, bootstrapped. Differentiation priority order: **AI-first → regional-language → cross-platform verification → community.** Philosophy is influencer-first; outcomes are brand-performance-first.

## Brand personality
Trustworthy, modern, fast, and accessible — not flashy or "agency-glossy." It should feel like a credible financial-grade marketplace (because of escrow/payments and verification) that is also creator-friendly and approachable to a 19-year-old nano-influencer in a Tier-3 city. Tone: confident, plain-spoken, encouraging. Avoid hype, avoid corporate stiffness.

Three adjectives to design against: **trusted, effortless, ambitious.**

## Logo direction
- A wordmark-led identity with a simple, scalable mark that works as an app icon at 1024px and at 48px.
- Concept territories to explore: (1) verification/trust — a subtle checkmark, seal, or shield woven into the mark; (2) connection — two elements meeting/linking (brand ↔ creator); (3) momentum/growth — an upward motion. Lean toward (1) or (2); verification is the moat.
- Must read clearly in one color (for stamps/badges) and reverse out on dark.
- Avoid: literal camera/play-button clichés, overused gradients-as-crutch, anything that won't shrink to a favicon.
- Deliver: primary lockup, mark-only, monochrome, and app-icon variants.

## Color palette (starting point — refine in-canvas)
Anchor on a single confident primary plus a clear "verified/success" accent, since trust is the core message.
- **Primary** — a deep, trustworthy blue/indigo (e.g. ~#2D5BFF region) for actions and brand.
- **Verified/success** — a distinct green (e.g. ~#1FB87A region) reserved for verification badges, payout-success, approvals. Keep it *only* for trust/positive states so it stays meaningful.
- **Warning/pending** — amber for "under review", "pending payout".
- **Error** — red for disputes/failures.
- **Neutrals** — a full gray ramp (background, surface, border, text-secondary, text-primary) for a clean, content-first UI.
- Provide light and dark themes. Meet WCAG AA contrast for all text and interactive states.

## Typography
- Must support **Latin + Indic scripts** (Devanagari, Tamil, Telugu, Bengali) for the regional-language roadmap — pick a family with strong multi-script coverage (e.g. an Inter/Noto pairing, or a single super-family). Verify the Indic glyphs actually render, not just Latin.
- One UI sans for everything; define a clear type scale (display, h1–h3, body, caption, label) with sizes, weights, and line-heights.
- Optimize for dense data (follower counts, engagement %, budgets) — tabular figures for numbers.

## Core component set (build these first — they cover F5 + P0 screens)
Button (primary/secondary/tertiary/destructive + loading/disabled), Text input + select/dropdown, Chip/filter pill (used heavily in discovery), Card (generic surface), **Influencer card** (avatar, handle, niche tags, verified badge, key metrics), **Campaign tile** (title, type, budget, deadline, match indicator), **Verified badge** (the trust signal — make it distinctive), Avatar, Tag/niche label, Tab bar / bottom navigation, Status pill (applied / under review / selected / approved / paid), Empty + loading + error states, Toast/notification.

## Design tokens (structure for clean design-sync into /mobile)
Export tokens in these groups so they map to `mobile/src/theme/`:
- `color` (primary, success/verified, warning, error, neutral ramp; light + dark)
- `typography` (family, scale, weights, line-heights)
- `spacing` (4/8-based scale)
- `radius` (sm/md/lg/pill)
- `elevation` (shadow levels)
- `breakpoints` (phone-first)

## Constraints
- **Performance:** discovery feed and swipe UX must hold 60fps and <2s load on 4G — favor lightweight vector assets, minimal heavy imagery in chrome, no decorative animations that block interaction.
- **Accessibility:** WCAG AA contrast; minimum 44px touch targets; the verified badge must be distinguishable without relying on color alone (add an icon/shape).
- **Platforms:** iOS 14+ and Android 8+; respect platform conventions where it matters (navigation, system fonts fallback).

## Deliverables to request from Claude Design
1. Logo set (primary, mark, monochrome, app icon).
2. Color + type tokens, light and dark.
3. The core component set above as a reusable library.
4. 3–5 key screens mocked to validate the system: influencer onboarding, discovery + filters, campaign tile/feed, campaign 5-step builder, My Influence portfolio.
5. Token export ready for `/design-sync` into `/mobile/src/theme/`.

## Handoff workflow
Once the system is approved in Claude Design, link the repo and run `/design-sync` to pull the component library/tokens into `/mobile`, fulfilling F5's design-system bootstrap. After that, design changes flow through the synced library — `/mobile` consumes tokens, never ad-hoc styles (per `mobile/CLAUDE.md` and ADR-0012).
