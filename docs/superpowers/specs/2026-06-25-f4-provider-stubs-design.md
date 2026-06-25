# F4 — Provider interfaces + stubs (design)

- **Card:** F4 · Provider interfaces + stubs (`docs/P0-task-cards.md`)
- **Package:** `/api` · **Depends on:** F2 (done)
- **Date:** 2026-06-25
- **Branch:** `f4-provider-stubs`

## Goal

Define the six integration provider interfaces with deterministic stub
implementations so P0 feature cards can be built before live vendor credentials
exist. Live wiring (Firebase, Razorpay, Meta/YouTube, Claude, FCM) is explicitly
deferred to the feature cards that need each provider (A1, A3, D-series, P1, G1).

## Acceptance criteria (from the card)

- Each interface has a stub returning deterministic fixtures.
- Unit tests cover each stub; no vendor SDK is imported outside its provider module.
- A config flag selects stub vs live implementation per provider.

## Decisions

1. **Live side = deferred placeholders.** Build full stubs + tests now. Each
   provider gets a `live.py` whose class raises `NotImplementedError` until its
   feature card wires the real SDK. The config flag can select `live`, but it
   fails loudly until implemented — a clear seam, no premature vendor coupling.
2. **Return types = Pydantic models**, defined in the service layer, consistent
   with the rest of the codebase and reusable by API response schemas later.
3. **Selection/DI = per-provider flag + FastAPI dependencies.** One env flag per
   provider (default `stub`), a registry that resolves each, and `Depends()`
   getters so routes inject providers and tests override them.

## Layout

Per-provider subpackages under `api/app/services/`. Each provider is a
self-contained unit, and `live.py` is the only place a vendor SDK may ever be
imported.

```
api/app/services/
  __init__.py
  registry.py              # per-provider factory + FastAPI Depends getters (lazy-imports live)
  auth/         {__init__, base, stub, live}.py
  verification/ {__init__, base, stub, live}.py
  payment/      {__init__, base, stub, live}.py
  ai/           {__init__, base, stub, live}.py
  search/       {__init__, base, stub, live}.py
  notification/ {__init__, base, stub, live}.py
```

- `base.py` — the ABC + that provider's Pydantic result model(s).
- `stub.py` — deterministic stub implementation.
- `live.py` — placeholder class raising `NotImplementedError` (the seam its
  feature card fills). No SDK imports yet.
- `registry.py` — lazily imports `live` **only** when the flag selects it, so the
  stub path never imports a vendor SDK.

## Interfaces

All methods are `async` (providers do network I/O; stubs keep the signature for
parity). Signatures are grounded in the committed contract shapes
(`VerifiedMetrics`, `Payout`, `InfluencerCard`, `Page`).

| Provider | Method(s) | Returns |
|---|---|---|
| `AuthProvider` | `verify_id_token(id_token)` | `AuthIdentity{uid, email, email_verified}` |
| `VerificationProvider` | `fetch_metrics(platform, oauth_code)` | `VerifiedMetrics{platform, followers, reach, engagement_rate, verified, snapshot_at}` |
| `PaymentProvider` | `create_payout(req)`, `verify_webhook(payload, signature)` | `PayoutResult{id, status, amount_inr, method}`, `WebhookEvent` |
| `AIService` | `generate_text(prompt, *, max_tokens=...)` | `str` |
| `SearchService` | `search_influencers(query)` | `InfluencerPage{items, page, page_size, total}` |
| `NotificationService` | `send_push(msg)`, `register_device_token(user_id, token, platform)`, `prune_token(token)` | `PushResult` / `None` |

Supporting types live in the relevant provider's `base.py`. A `Platform`
str-enum (`instagram`, `youtube`) is newly defined in `verification/base.py`,
following the same `str, enum.Enum` pattern as `Role` in `app/models/user.py`.
Pydantic result models: `AuthIdentity`, `VerifiedMetrics`, `PayoutRequest`,
`PayoutResult`,
`WebhookEvent`, `InfluencerQuery`, `InfluencerCard`, `InfluencerPage`,
`PushMessage`, `PushResult`.

## Stub fixtures (deterministic)

Fixed values, fixed timestamps (a module-level datetime constant — never
`datetime.now()`), so tests are stable:

- `StubAuthProvider.verify_id_token(t)` → `uid=f"stub-uid-{t}"`,
  `email=f"stub-uid-{t}@stub.cravio.in"`, `email_verified=True`. Empty token
  raises `ValueError`.
- `StubVerificationProvider.fetch_metrics(...)` → `followers=12000, reach=48000,
  engagement_rate=4.2, verified=True, snapshot_at=FIXED_TS`, echoing the
  requested `platform`.
- `StubPaymentProvider.create_payout(req)` → `id=f"stub_payout_{req...}"`,
  `status="processing"`, echoing `amount_inr`/`method`. `verify_webhook(...)` →
  a parsed `WebhookEvent` (stub treats any signature as valid).
- `StubAIService.generate_text(prompt)` → a fixed canned string.
- `StubSearchService.search_influencers(query)` → a fixed list of
  `InfluencerCard` with a computed `total`, honoring `page`/`page_size`.
- `StubNotificationService` → `send_push` returns a fixed-id `PushResult`;
  `register_device_token`/`prune_token` are deterministic no-ops.

## Config + injection

Extend `app/core/config.py` `Settings` with six flags, each
`Literal["stub", "live"]` defaulting to `"stub"`:

| Field | Env var |
|---|---|
| `auth_provider` | `AUTH_PROVIDER` |
| `verification_provider` | `VERIFICATION_PROVIDER` |
| `payment_provider` | `PAYMENT_PROVIDER` |
| `ai_service` | `AI_SERVICE` |
| `search_service` | `SEARCH_SERVICE` |
| `notification_service` | `NOTIFICATION_SERVICE` |

`registry.py` exposes `build_<provider>()` factories and matching
`get_<provider>()` FastAPI dependency getters. Each `build_` reads its flag at
call time (so tests can monkeypatch `settings`), lazily imports `live` when
`== "live"`, otherwise returns a shared module-level stub singleton (stubs are
stateless, so one instance is reused). The `get_` getters delegate to `build_`
and are used as FastAPI dependencies; tests override via
`app.dependency_overrides`. The six flags are documented in `.env.example`.

## Tests (TDD)

- One unit test per stub asserting its deterministic fixture values.
- Registry tests: default flag → stub instance; flag set to `live` → getter
  lazy-imports `live` and raises `NotImplementedError` (proves the seam).
- SDK-isolation guard: a test scanning `app/services/**/*.py` and asserting no
  known vendor SDK import (`firebase_admin`, `razorpay`, `anthropic`,
  `google.*`, `firebase_admin.messaging`, etc.) appears outside a `live.py`.

## Out of scope / non-impact

- **No routes added.** Providers are internal services injected by later cards,
  so `docs/openapi.yaml` does not change and the F3 drift check stays green.
- **No live vendor integrations** and **no new runtime dependencies** (vendor
  SDKs are added by the feature cards that implement each `live.py`).
- Live `live.py` modules contain placeholders only.
