# ADR-0007: Claude API for AI features

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0 (decision) / Phase 2 (caption + script) / Phase 3 (trend analysis)

## Context
AI is the #1 differentiator: caption generator, script/hook writer, and trend analysis. These ship in Phase 2–3 but the interface and stub belong in Phase 0 so the rest of the app can build around them.

## Decision
Use the Claude API (Anthropic) for all generative AI features, behind an internal `AIService` interface so call sites are provider-agnostic and testable with stubs before live keys exist.

## Rationale
- Strong instruction-following and multilingual output (supports the regional-language differentiator).
- One vendor and SDK shared with the agent build tooling.
- Interface abstraction lets us stub deterministic responses in tests and swap models without touching features.

## Alternatives considered
- **OpenAI / Gemini:** capable alternatives; the interface keeps switching cheap, but Claude is the committed default.
- **Self-hosted open models:** capital- and ops-heavy; rejected for a bootstrapped solo build.

## Consequences
- AI calls are rate-limited and cached where possible to control cost; premium AI tiers gate heavy usage (business model).
- All AI output is treated as draft (human-in-the-loop) — captions/scripts are editable before use.
- Prompt templates and model versions are config, not hard-coded, and live behind the `AIService`.
