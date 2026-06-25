# F4 Provider Interfaces + Stubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define six integration provider interfaces (Auth, Verification, Payment, AI, Search, Notification) with deterministic stub implementations, deferred live placeholders, a per-provider stub/live config flag, and FastAPI dependency injection — so P0 feature cards can build before live vendor credentials exist.

**Architecture:** Each provider is a self-contained subpackage under `api/app/services/<provider>/` with `base.py` (ABC + Pydantic result models), `stub.py` (deterministic stub), and `live.py` (placeholder raising `NotImplementedError`, wired by a later feature card). A `registry.py` resolves stub-vs-live per provider from config and exposes FastAPI dependency getters; it lazily imports `live` only when selected, so the stub path never imports a vendor SDK. A test guards that SDK-isolation invariant.

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, `abc.ABC`, pytest.

## Global Constraints

- Python `>=3.12`; FastAPI `>=0.115`; Pydantic v2 (via `pydantic-settings>=2.5`).
- No vendor SDK imported anywhere except inside a provider's `live.py`.
- Provider methods that do I/O are `async`.
- Stubs return **deterministic** fixtures — fixed values and fixed timestamps; never `datetime.now()`.
- Config flags read from environment by name only; defaults are `"stub"`.
- F4 adds **no API routes** — `docs/openapi.yaml` must not change (F3 drift check stays green).
- No new runtime dependencies added to `pyproject.toml` / `requirements-dev.txt`.
- Tests-first (TDD). Commit after each task.
- Run all commands from the `api/` directory (`cd api`).

---

### Task 1: Provider config flags + services package

**Files:**
- Modify: `api/app/core/config.py`
- Create: `api/app/services/__init__.py`
- Test: `api/tests/test_provider_config.py`

**Interfaces:**
- Consumes: existing `Settings` in `app/core/config.py` (has `database_url`, `redis_url`).
- Produces: `settings.auth_provider`, `settings.verification_provider`, `settings.payment_provider`, `settings.ai_service`, `settings.search_service`, `settings.notification_service` — each `Literal["stub", "live"]`, default `"stub"`. Env vars: `AUTH_PROVIDER`, `VERIFICATION_PROVIDER`, `PAYMENT_PROVIDER`, `AI_SERVICE`, `SEARCH_SERVICE`, `NOTIFICATION_SERVICE`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/test_provider_config.py`:

```python
from app.core.config import Settings


def test_provider_flags_default_to_stub():
    s = Settings(database_url="x", redis_url="y")
    assert s.auth_provider == "stub"
    assert s.verification_provider == "stub"
    assert s.payment_provider == "stub"
    assert s.ai_service == "stub"
    assert s.search_service == "stub"
    assert s.notification_service == "stub"


def test_provider_flag_reads_env(monkeypatch):
    monkeypatch.setenv("AUTH_PROVIDER", "live")
    s = Settings(database_url="x", redis_url="y")
    assert s.auth_provider == "live"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pytest tests/test_provider_config.py -v`
Expected: FAIL (`AttributeError: 'Settings' object has no attribute 'auth_provider'`).

- [ ] **Step 3: Implement the config flags**

Edit `api/app/core/config.py` to:

```python
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

ProviderMode = Literal["stub", "live"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    redis_url: str

    auth_provider: ProviderMode = "stub"
    verification_provider: ProviderMode = "stub"
    payment_provider: ProviderMode = "stub"
    ai_service: ProviderMode = "stub"
    search_service: ProviderMode = "stub"
    notification_service: ProviderMode = "stub"


settings = Settings()
```

Create empty `api/app/services/__init__.py`:

```python
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pytest tests/test_provider_config.py -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add api/app/core/config.py api/app/services/__init__.py api/tests/test_provider_config.py
git commit -m "F4: per-provider stub/live config flags"
```

---

### Task 2: AuthProvider (Firebase)

**Files:**
- Create: `api/app/services/auth/__init__.py`, `api/app/services/auth/base.py`, `api/app/services/auth/stub.py`, `api/app/services/auth/live.py`
- Test: `api/tests/services/test_auth.py`

**Interfaces:**
- Produces: `AuthIdentity{uid: str, email: str | None, email_verified: bool}`; `AuthProvider` ABC with `async def verify_id_token(self, id_token: str) -> AuthIdentity`; `StubAuthProvider`; `FirebaseAuthProvider` (placeholder, raises `NotImplementedError` in `__init__`).

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/__init__.py` (empty) and `api/tests/services/test_auth.py`:

```python
import pytest

from app.services.auth.base import AuthIdentity, AuthProvider
from app.services.auth.live import FirebaseAuthProvider
from app.services.auth.stub import StubAuthProvider


@pytest.mark.asyncio
async def test_stub_returns_deterministic_identity():
    provider = StubAuthProvider()
    identity = await provider.verify_id_token("abc")
    assert isinstance(identity, AuthIdentity)
    assert identity.uid == "stub-uid-abc"
    assert identity.email == "stub-uid-abc@stub.cravio.in"
    assert identity.email_verified is True


@pytest.mark.asyncio
async def test_stub_rejects_empty_token():
    with pytest.raises(ValueError):
        await StubAuthProvider().verify_id_token("")


def test_stub_is_an_auth_provider():
    assert isinstance(StubAuthProvider(), AuthProvider)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        FirebaseAuthProvider()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pytest tests/services/test_auth.py -v`
Expected: FAIL (`ModuleNotFoundError: No module named 'app.services.auth'`).

- [ ] **Step 3: Implement the provider**

`api/app/services/auth/__init__.py` (empty):

```python
```

`api/app/services/auth/base.py`:

```python
import abc

from pydantic import BaseModel


class AuthIdentity(BaseModel):
    """Identity resolved from a verified auth token."""

    uid: str
    email: str | None = None
    email_verified: bool = False


class AuthProvider(abc.ABC):
    @abc.abstractmethod
    async def verify_id_token(self, id_token: str) -> AuthIdentity:
        """Verify an auth ID token and return the caller's identity."""
```

`api/app/services/auth/stub.py`:

```python
from app.services.auth.base import AuthIdentity, AuthProvider


class StubAuthProvider(AuthProvider):
    async def verify_id_token(self, id_token: str) -> AuthIdentity:
        if not id_token:
            raise ValueError("id_token must not be empty")
        uid = f"stub-uid-{id_token}"
        return AuthIdentity(uid=uid, email=f"{uid}@stub.cravio.in", email_verified=True)
```

`api/app/services/auth/live.py`:

```python
from app.services.auth.base import AuthIdentity, AuthProvider


class FirebaseAuthProvider(AuthProvider):
    """Live Firebase implementation. Wired in card A1 (do not import the SDK elsewhere)."""

    def __init__(self) -> None:
        raise NotImplementedError("FirebaseAuthProvider is wired in card A1")

    async def verify_id_token(self, id_token: str) -> AuthIdentity:
        raise NotImplementedError
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pytest tests/services/test_auth.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add api/app/services/auth api/tests/services/__init__.py api/tests/services/test_auth.py
git commit -m "F4: AuthProvider interface + stub"
```

---

### Task 3: VerificationProvider (Meta/YouTube) + Platform enum

**Files:**
- Create: `api/app/services/verification/__init__.py`, `base.py`, `stub.py`, `live.py`
- Test: `api/tests/services/test_verification.py`

**Interfaces:**
- Produces: `Platform` str-enum (`instagram`, `youtube`); `VerifiedMetrics{platform: Platform, followers: int, reach: int, engagement_rate: float, verified: bool, snapshot_at: datetime}`; `VerificationProvider` ABC with `async def fetch_metrics(self, platform: Platform, oauth_code: str) -> VerifiedMetrics`; `StubVerificationProvider`; `MetaYouTubeVerificationProvider` (placeholder). Also exports module constant `STUB_SNAPSHOT_AT: datetime`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/test_verification.py`:

```python
import pytest

from app.services.verification.base import Platform, VerificationProvider, VerifiedMetrics
from app.services.verification.live import MetaYouTubeVerificationProvider
from app.services.verification.stub import STUB_SNAPSHOT_AT, StubVerificationProvider


@pytest.mark.asyncio
async def test_stub_returns_deterministic_metrics():
    provider = StubVerificationProvider()
    metrics = await provider.fetch_metrics(Platform.instagram, "oauth-code")
    assert isinstance(metrics, VerifiedMetrics)
    assert metrics.platform == Platform.instagram
    assert metrics.followers == 12000
    assert metrics.reach == 48000
    assert metrics.engagement_rate == 4.2
    assert metrics.verified is True
    assert metrics.snapshot_at == STUB_SNAPSHOT_AT


@pytest.mark.asyncio
async def test_stub_echoes_requested_platform():
    metrics = await StubVerificationProvider().fetch_metrics(Platform.youtube, "code")
    assert metrics.platform == Platform.youtube


def test_stub_is_a_verification_provider():
    assert isinstance(StubVerificationProvider(), VerificationProvider)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        MetaYouTubeVerificationProvider()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pytest tests/services/test_verification.py -v`
Expected: FAIL (`ModuleNotFoundError: No module named 'app.services.verification'`).

- [ ] **Step 3: Implement the provider**

`api/app/services/verification/__init__.py` (empty):

```python
```

`api/app/services/verification/base.py`:

```python
import abc
import enum
from datetime import datetime

from pydantic import BaseModel


class Platform(str, enum.Enum):
    instagram = "instagram"
    youtube = "youtube"


class VerifiedMetrics(BaseModel):
    platform: Platform
    followers: int
    reach: int
    engagement_rate: float
    verified: bool
    snapshot_at: datetime


class VerificationProvider(abc.ABC):
    @abc.abstractmethod
    async def fetch_metrics(self, platform: Platform, oauth_code: str) -> VerifiedMetrics:
        """Fetch verified metrics for a connected social account."""
```

`api/app/services/verification/stub.py`:

```python
from datetime import datetime, timezone

from app.services.verification.base import Platform, VerificationProvider, VerifiedMetrics

STUB_SNAPSHOT_AT = datetime(2026, 1, 1, tzinfo=timezone.utc)


class StubVerificationProvider(VerificationProvider):
    async def fetch_metrics(self, platform: Platform, oauth_code: str) -> VerifiedMetrics:
        return VerifiedMetrics(
            platform=platform,
            followers=12000,
            reach=48000,
            engagement_rate=4.2,
            verified=True,
            snapshot_at=STUB_SNAPSHOT_AT,
        )
```

`api/app/services/verification/live.py`:

```python
from app.services.verification.base import Platform, VerificationProvider, VerifiedMetrics


class MetaYouTubeVerificationProvider(VerificationProvider):
    """Live Meta/YouTube implementation. Wired in card A3 (SDK imports stay in this module)."""

    def __init__(self) -> None:
        raise NotImplementedError("MetaYouTubeVerificationProvider is wired in card A3")

    async def fetch_metrics(self, platform: Platform, oauth_code: str) -> VerifiedMetrics:
        raise NotImplementedError
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pytest tests/services/test_verification.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add api/app/services/verification api/tests/services/test_verification.py
git commit -m "F4: VerificationProvider interface + stub"
```

---

### Task 4: PaymentProvider (Razorpay)

**Files:**
- Create: `api/app/services/payment/__init__.py`, `base.py`, `stub.py`, `live.py`
- Test: `api/tests/services/test_payment.py`

**Interfaces:**
- Produces: `PayoutMethod` enum (`upi`, `bank`, `paytm`); `PayoutStatus` enum (`initiated`, `processing`, `paid`, `failed`); `PayoutRequest{amount_inr: int, method: PayoutMethod, reference: str}`; `PayoutResult{id: str, status: PayoutStatus, amount_inr: int, method: PayoutMethod}`; `WebhookEvent{event: str, verified: bool, payload: dict}`; `PaymentProvider` ABC with `async def create_payout(self, request: PayoutRequest) -> PayoutResult` and `async def verify_webhook(self, payload: bytes, signature: str) -> WebhookEvent`; `StubPaymentProvider`; `RazorpayPaymentProvider` (placeholder).

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/test_payment.py`:

```python
import pytest

from app.services.payment.base import (
    PaymentProvider,
    PayoutMethod,
    PayoutRequest,
    PayoutResult,
    PayoutStatus,
    WebhookEvent,
)
from app.services.payment.live import RazorpayPaymentProvider
from app.services.payment.stub import StubPaymentProvider


@pytest.mark.asyncio
async def test_stub_create_payout_is_deterministic():
    req = PayoutRequest(amount_inr=5000, method=PayoutMethod.upi, reference="app-1")
    result = await StubPaymentProvider().create_payout(req)
    assert isinstance(result, PayoutResult)
    assert result.id == "stub_payout_app-1"
    assert result.status == PayoutStatus.processing
    assert result.amount_inr == 5000
    assert result.method == PayoutMethod.upi


@pytest.mark.asyncio
async def test_stub_verify_webhook_parses_and_trusts():
    event = await StubPaymentProvider().verify_webhook(b'{"event": "payout.paid"}', "sig")
    assert isinstance(event, WebhookEvent)
    assert event.event == "payout.paid"
    assert event.verified is True
    assert event.payload == {"event": "payout.paid"}


def test_stub_is_a_payment_provider():
    assert isinstance(StubPaymentProvider(), PaymentProvider)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        RazorpayPaymentProvider()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pytest tests/services/test_payment.py -v`
Expected: FAIL (`ModuleNotFoundError: No module named 'app.services.payment'`).

- [ ] **Step 3: Implement the provider**

`api/app/services/payment/__init__.py` (empty):

```python
```

`api/app/services/payment/base.py`:

```python
import abc
import enum

from pydantic import BaseModel


class PayoutMethod(str, enum.Enum):
    upi = "upi"
    bank = "bank"
    paytm = "paytm"


class PayoutStatus(str, enum.Enum):
    initiated = "initiated"
    processing = "processing"
    paid = "paid"
    failed = "failed"


class PayoutRequest(BaseModel):
    amount_inr: int
    method: PayoutMethod
    reference: str


class PayoutResult(BaseModel):
    id: str
    status: PayoutStatus
    amount_inr: int
    method: PayoutMethod


class WebhookEvent(BaseModel):
    event: str
    verified: bool
    payload: dict


class PaymentProvider(abc.ABC):
    @abc.abstractmethod
    async def create_payout(self, request: PayoutRequest) -> PayoutResult:
        """Initiate a payout to an influencer."""

    @abc.abstractmethod
    async def verify_webhook(self, payload: bytes, signature: str) -> WebhookEvent:
        """Verify a payment webhook signature and return the parsed event."""
```

`api/app/services/payment/stub.py`:

```python
import json

from app.services.payment.base import (
    PaymentProvider,
    PayoutRequest,
    PayoutResult,
    PayoutStatus,
    WebhookEvent,
)


class StubPaymentProvider(PaymentProvider):
    async def create_payout(self, request: PayoutRequest) -> PayoutResult:
        return PayoutResult(
            id=f"stub_payout_{request.reference}",
            status=PayoutStatus.processing,
            amount_inr=request.amount_inr,
            method=request.method,
        )

    async def verify_webhook(self, payload: bytes, signature: str) -> WebhookEvent:
        data = json.loads(payload or b"{}")
        return WebhookEvent(event=data.get("event", "stub.event"), verified=True, payload=data)
```

`api/app/services/payment/live.py`:

```python
from app.services.payment.base import (
    PaymentProvider,
    PayoutRequest,
    PayoutResult,
    WebhookEvent,
)


class RazorpayPaymentProvider(PaymentProvider):
    """Live Razorpay implementation. Wired in card P1 (SDK imports stay in this module)."""

    def __init__(self) -> None:
        raise NotImplementedError("RazorpayPaymentProvider is wired in card P1")

    async def create_payout(self, request: PayoutRequest) -> PayoutResult:
        raise NotImplementedError

    async def verify_webhook(self, payload: bytes, signature: str) -> WebhookEvent:
        raise NotImplementedError
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pytest tests/services/test_payment.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add api/app/services/payment api/tests/services/test_payment.py
git commit -m "F4: PaymentProvider interface + stub"
```

---

### Task 5: AIService (Claude)

**Files:**
- Create: `api/app/services/ai/__init__.py`, `base.py`, `stub.py`, `live.py`
- Test: `api/tests/services/test_ai.py`

**Interfaces:**
- Produces: `AIService` ABC with `async def generate_text(self, prompt: str, *, max_tokens: int = 512) -> str`; `StubAIService`; `ClaudeAIService` (placeholder).

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/test_ai.py`:

```python
import pytest

from app.services.ai.base import AIService
from app.services.ai.live import ClaudeAIService
from app.services.ai.stub import StubAIService


@pytest.mark.asyncio
async def test_stub_returns_deterministic_text():
    out = await StubAIService().generate_text("write a caption")
    assert out == "[stub-ai] generated response"


def test_stub_is_an_ai_service():
    assert isinstance(StubAIService(), AIService)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        ClaudeAIService()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pytest tests/services/test_ai.py -v`
Expected: FAIL (`ModuleNotFoundError: No module named 'app.services.ai'`).

- [ ] **Step 3: Implement the provider**

`api/app/services/ai/__init__.py` (empty):

```python
```

`api/app/services/ai/base.py`:

```python
import abc


class AIService(abc.ABC):
    @abc.abstractmethod
    async def generate_text(self, prompt: str, *, max_tokens: int = 512) -> str:
        """Generate text from a prompt."""
```

`api/app/services/ai/stub.py`:

```python
from app.services.ai.base import AIService


class StubAIService(AIService):
    async def generate_text(self, prompt: str, *, max_tokens: int = 512) -> str:
        return "[stub-ai] generated response"
```

`api/app/services/ai/live.py`:

```python
from app.services.ai.base import AIService


class ClaudeAIService(AIService):
    """Live Claude implementation. Wired in a later AI feature card (SDK imports stay here)."""

    def __init__(self) -> None:
        raise NotImplementedError("ClaudeAIService is wired in a later AI feature card")

    async def generate_text(self, prompt: str, *, max_tokens: int = 512) -> str:
        raise NotImplementedError
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pytest tests/services/test_ai.py -v`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add api/app/services/ai api/tests/services/test_ai.py
git commit -m "F4: AIService interface + stub"
```

---

### Task 6: SearchService

**Files:**
- Create: `api/app/services/search/__init__.py`, `base.py`, `stub.py`, `live.py`
- Test: `api/tests/services/test_search.py`

**Interfaces:**
- Consumes: `Platform`, `VerifiedMetrics` from `app.services.verification.base` (Task 3).
- Produces: `InfluencerQuery{q: str | None, niche: list[str], city: str | None, platform: Platform | None, min_followers: int | None, page: int = 1, page_size: int = 20}`; `InfluencerCard{id: str, handle: str, niche: list[str], city: str | None, verified: bool, metrics: VerifiedMetrics | None}`; `InfluencerPage{items: list[InfluencerCard], page: int, page_size: int, total: int}`; `SearchService` ABC with `async def search_influencers(self, query: InfluencerQuery) -> InfluencerPage`; `StubSearchService`; `PostgresSearchService` (placeholder).

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/test_search.py`:

```python
import pytest

from app.services.search.base import InfluencerPage, InfluencerQuery, SearchService
from app.services.search.live import PostgresSearchService
from app.services.search.stub import StubSearchService


@pytest.mark.asyncio
async def test_stub_returns_deterministic_page():
    page = await StubSearchService().search_influencers(InfluencerQuery())
    assert isinstance(page, InfluencerPage)
    assert page.total == 1
    assert page.items[0].id == "stub-influencer-1"
    assert page.items[0].handle == "@stub_creator"
    assert page.items[0].verified is True


@pytest.mark.asyncio
async def test_stub_echoes_pagination():
    page = await StubSearchService().search_influencers(InfluencerQuery(page=3, page_size=50))
    assert page.page == 3
    assert page.page_size == 50


def test_stub_is_a_search_service():
    assert isinstance(StubSearchService(), SearchService)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        PostgresSearchService()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pytest tests/services/test_search.py -v`
Expected: FAIL (`ModuleNotFoundError: No module named 'app.services.search'`).

- [ ] **Step 3: Implement the provider**

`api/app/services/search/__init__.py` (empty):

```python
```

`api/app/services/search/base.py`:

```python
import abc

from pydantic import BaseModel, Field

from app.services.verification.base import Platform, VerifiedMetrics


class InfluencerQuery(BaseModel):
    q: str | None = None
    niche: list[str] = Field(default_factory=list)
    city: str | None = None
    platform: Platform | None = None
    min_followers: int | None = None
    page: int = 1
    page_size: int = 20


class InfluencerCard(BaseModel):
    id: str
    handle: str
    niche: list[str] = Field(default_factory=list)
    city: str | None = None
    verified: bool = False
    metrics: VerifiedMetrics | None = None


class InfluencerPage(BaseModel):
    items: list[InfluencerCard]
    page: int
    page_size: int
    total: int


class SearchService(abc.ABC):
    @abc.abstractmethod
    async def search_influencers(self, query: InfluencerQuery) -> InfluencerPage:
        """Search and filter influencers."""
```

`api/app/services/search/stub.py`:

```python
from app.services.search.base import (
    InfluencerCard,
    InfluencerPage,
    InfluencerQuery,
    SearchService,
)


class StubSearchService(SearchService):
    async def search_influencers(self, query: InfluencerQuery) -> InfluencerPage:
        items = [
            InfluencerCard(
                id="stub-influencer-1",
                handle="@stub_creator",
                niche=["fashion"],
                city="Mumbai",
                verified=True,
                metrics=None,
            )
        ]
        return InfluencerPage(
            items=items,
            page=query.page,
            page_size=query.page_size,
            total=len(items),
        )
```

`api/app/services/search/live.py`:

```python
from app.services.search.base import InfluencerPage, InfluencerQuery, SearchService


class PostgresSearchService(SearchService):
    """Live Postgres FTS/trigram implementation. Wired in card D1."""

    def __init__(self) -> None:
        raise NotImplementedError("PostgresSearchService is wired in card D1")

    async def search_influencers(self, query: InfluencerQuery) -> InfluencerPage:
        raise NotImplementedError
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pytest tests/services/test_search.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add api/app/services/search api/tests/services/test_search.py
git commit -m "F4: SearchService interface + stub"
```

---

### Task 7: NotificationService (FCM)

**Files:**
- Create: `api/app/services/notification/__init__.py`, `base.py`, `stub.py`, `live.py`
- Test: `api/tests/services/test_notification.py`

**Interfaces:**
- Produces: `DevicePlatform` enum (`ios`, `android`); `PushMessage{token: str, title: str, body: str}`; `PushResult{id: str, delivered: bool}`; `NotificationService` ABC with `async def send_push(self, message: PushMessage) -> PushResult`, `async def register_device_token(self, user_id: str, token: str, platform: DevicePlatform) -> None`, `async def prune_token(self, token: str) -> None`; `StubNotificationService`; `FcmNotificationService` (placeholder).

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/test_notification.py`:

```python
import pytest

from app.services.notification.base import (
    DevicePlatform,
    NotificationService,
    PushMessage,
    PushResult,
)
from app.services.notification.live import FcmNotificationService
from app.services.notification.stub import StubNotificationService


@pytest.mark.asyncio
async def test_stub_send_push_is_deterministic():
    result = await StubNotificationService().send_push(
        PushMessage(token="dev-1", title="Hi", body="You were selected")
    )
    assert isinstance(result, PushResult)
    assert result.id == "stub_push_dev-1"
    assert result.delivered is True


@pytest.mark.asyncio
async def test_stub_register_and_prune_are_noops():
    svc = StubNotificationService()
    assert await svc.register_device_token("user-1", "dev-1", DevicePlatform.ios) is None
    assert await svc.prune_token("dev-1") is None


def test_stub_is_a_notification_service():
    assert isinstance(StubNotificationService(), NotificationService)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        FcmNotificationService()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pytest tests/services/test_notification.py -v`
Expected: FAIL (`ModuleNotFoundError: No module named 'app.services.notification'`).

- [ ] **Step 3: Implement the provider**

`api/app/services/notification/__init__.py` (empty):

```python
```

`api/app/services/notification/base.py`:

```python
import abc
import enum

from pydantic import BaseModel


class DevicePlatform(str, enum.Enum):
    ios = "ios"
    android = "android"


class PushMessage(BaseModel):
    token: str
    title: str
    body: str


class PushResult(BaseModel):
    id: str
    delivered: bool


class NotificationService(abc.ABC):
    @abc.abstractmethod
    async def send_push(self, message: PushMessage) -> PushResult:
        """Send a push notification to a device."""

    @abc.abstractmethod
    async def register_device_token(
        self, user_id: str, token: str, platform: DevicePlatform
    ) -> None:
        """Register or refresh a device token for a user."""

    @abc.abstractmethod
    async def prune_token(self, token: str) -> None:
        """Remove a stale/invalid device token."""
```

`api/app/services/notification/stub.py`:

```python
from app.services.notification.base import (
    DevicePlatform,
    NotificationService,
    PushMessage,
    PushResult,
)


class StubNotificationService(NotificationService):
    async def send_push(self, message: PushMessage) -> PushResult:
        return PushResult(id=f"stub_push_{message.token}", delivered=True)

    async def register_device_token(
        self, user_id: str, token: str, platform: DevicePlatform
    ) -> None:
        return None

    async def prune_token(self, token: str) -> None:
        return None
```

`api/app/services/notification/live.py`:

```python
from app.services.notification.base import (
    DevicePlatform,
    NotificationService,
    PushMessage,
    PushResult,
)


class FcmNotificationService(NotificationService):
    """Live Firebase Cloud Messaging implementation. Wired in card G1 (SDK imports stay here)."""

    def __init__(self) -> None:
        raise NotImplementedError("FcmNotificationService is wired in card G1")

    async def send_push(self, message: PushMessage) -> PushResult:
        raise NotImplementedError

    async def register_device_token(
        self, user_id: str, token: str, platform: DevicePlatform
    ) -> None:
        raise NotImplementedError

    async def prune_token(self, token: str) -> None:
        raise NotImplementedError
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pytest tests/services/test_notification.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add api/app/services/notification api/tests/services/test_notification.py
git commit -m "F4: NotificationService interface + stub"
```

---

### Task 8: Provider registry + FastAPI dependencies

**Files:**
- Create: `api/app/services/registry.py`
- Test: `api/tests/services/test_registry.py`

**Interfaces:**
- Consumes: `settings` (Task 1); all six `base`/`stub`/`live` modules (Tasks 2–7).
- Produces: `build_auth_provider() -> AuthProvider`, `build_verification_provider() -> VerificationProvider`, `build_payment_provider() -> PaymentProvider`, `build_ai_service() -> AIService`, `build_search_service() -> SearchService`, `build_notification_service() -> NotificationService` (read the flag at call time; return shared stub singleton when `stub`, lazily import + construct live when `live`). Matching FastAPI dependency getters `get_<name>()` that delegate to the corresponding `build_<name>()`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/test_registry.py`:

```python
import pytest

from app.core.config import settings
from app.services import registry
from app.services.ai.stub import StubAIService
from app.services.auth.base import AuthProvider
from app.services.auth.stub import StubAuthProvider
from app.services.notification.stub import StubNotificationService
from app.services.payment.stub import StubPaymentProvider
from app.services.search.stub import StubSearchService
from app.services.verification.stub import StubVerificationProvider


def test_build_defaults_to_stub_instances():
    assert isinstance(registry.build_auth_provider(), StubAuthProvider)
    assert isinstance(registry.build_verification_provider(), StubVerificationProvider)
    assert isinstance(registry.build_payment_provider(), StubPaymentProvider)
    assert isinstance(registry.build_ai_service(), StubAIService)
    assert isinstance(registry.build_search_service(), StubSearchService)
    assert isinstance(registry.build_notification_service(), StubNotificationService)


def test_build_auth_provider_returns_auth_provider():
    assert isinstance(registry.build_auth_provider(), AuthProvider)


def test_stub_instances_are_singletons():
    assert registry.build_auth_provider() is registry.build_auth_provider()


def test_get_dependency_delegates_to_build():
    assert registry.get_auth_provider() is registry.build_auth_provider()


def test_live_flag_attempts_live_and_raises(monkeypatch):
    monkeypatch.setattr(settings, "auth_provider", "live")
    with pytest.raises(NotImplementedError):
        registry.build_auth_provider()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pytest tests/services/test_registry.py -v`
Expected: FAIL (`ModuleNotFoundError: No module named 'app.services.registry'`).

- [ ] **Step 3: Implement the registry**

`api/app/services/registry.py`:

```python
"""Resolve stub-vs-live provider implementations per config flag.

`build_*` reads the flag at call time so tests can monkeypatch `settings`. Live
modules are imported lazily, so the stub path never imports a vendor SDK. The
`get_*` functions are FastAPI dependencies; tests override them via
`app.dependency_overrides`.
"""

from app.core.config import settings
from app.services.ai.base import AIService
from app.services.ai.stub import StubAIService
from app.services.auth.base import AuthProvider
from app.services.auth.stub import StubAuthProvider
from app.services.notification.base import NotificationService
from app.services.notification.stub import StubNotificationService
from app.services.payment.base import PaymentProvider
from app.services.payment.stub import StubPaymentProvider
from app.services.search.base import SearchService
from app.services.search.stub import StubSearchService
from app.services.verification.base import VerificationProvider
from app.services.verification.stub import StubVerificationProvider

_auth_stub = StubAuthProvider()
_verification_stub = StubVerificationProvider()
_payment_stub = StubPaymentProvider()
_ai_stub = StubAIService()
_search_stub = StubSearchService()
_notification_stub = StubNotificationService()


def build_auth_provider() -> AuthProvider:
    if settings.auth_provider == "live":
        from app.services.auth.live import FirebaseAuthProvider

        return FirebaseAuthProvider()
    return _auth_stub


def build_verification_provider() -> VerificationProvider:
    if settings.verification_provider == "live":
        from app.services.verification.live import MetaYouTubeVerificationProvider

        return MetaYouTubeVerificationProvider()
    return _verification_stub


def build_payment_provider() -> PaymentProvider:
    if settings.payment_provider == "live":
        from app.services.payment.live import RazorpayPaymentProvider

        return RazorpayPaymentProvider()
    return _payment_stub


def build_ai_service() -> AIService:
    if settings.ai_service == "live":
        from app.services.ai.live import ClaudeAIService

        return ClaudeAIService()
    return _ai_stub


def build_search_service() -> SearchService:
    if settings.search_service == "live":
        from app.services.search.live import PostgresSearchService

        return PostgresSearchService()
    return _search_stub


def build_notification_service() -> NotificationService:
    if settings.notification_service == "live":
        from app.services.notification.live import FcmNotificationService

        return FcmNotificationService()
    return _notification_stub


# FastAPI dependency getters (override via app.dependency_overrides in tests).
def get_auth_provider() -> AuthProvider:
    return build_auth_provider()


def get_verification_provider() -> VerificationProvider:
    return build_verification_provider()


def get_payment_provider() -> PaymentProvider:
    return build_payment_provider()


def get_ai_service() -> AIService:
    return build_ai_service()


def get_search_service() -> SearchService:
    return build_search_service()


def get_notification_service() -> NotificationService:
    return build_notification_service()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pytest tests/services/test_registry.py -v`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
git add api/app/services/registry.py api/tests/services/test_registry.py
git commit -m "F4: provider registry + FastAPI dependency getters"
```

---

### Task 9: SDK-isolation guard + .env.example docs

**Files:**
- Create: `api/tests/services/test_provider_isolation.py`
- Modify: `api/.env.example`

**Interfaces:**
- Consumes: the `app/services/` tree (Tasks 1–8).
- Produces: a test asserting no vendor SDK import appears outside a `live.py`; documented provider flags in `.env.example`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/services/test_provider_isolation.py`:

```python
import re
from pathlib import Path

SERVICES_DIR = Path(__file__).resolve().parents[2] / "app" / "services"
VENDOR_SDKS = (
    "firebase_admin",
    "razorpay",
    "anthropic",
    "googleapiclient",
    "google.oauth2",
    "google.auth",
)


def test_no_vendor_sdk_imported_outside_live_modules():
    offenders = []
    for path in SERVICES_DIR.rglob("*.py"):
        if path.name == "live.py":
            continue
        text = path.read_text(encoding="utf-8")
        for sdk in VENDOR_SDKS:
            pattern = rf"^\s*(?:import|from)\s+{re.escape(sdk)}\b"
            if re.search(pattern, text, re.MULTILINE):
                offenders.append(f"{path.relative_to(SERVICES_DIR)} imports {sdk}")
    assert offenders == [], f"vendor SDK imported outside live.py: {offenders}"


def test_isolation_check_actually_scans_files():
    # Guard against the scan silently finding nothing because the path is wrong.
    scanned = list(SERVICES_DIR.rglob("*.py"))
    assert len(scanned) >= 12
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd api && pytest tests/services/test_provider_isolation.py -v`
Expected: PASS (2 passed). (No live module imports an SDK yet, so the guard passes; the second test confirms the scan reaches real files.)

- [ ] **Step 3: Document the flags in `.env.example`**

Replace `api/.env.example` contents with:

```
DATABASE_URL=
REDIS_URL=

# Provider selection: "stub" (default) or "live". Live impls are wired by their feature cards.
AUTH_PROVIDER=stub
VERIFICATION_PROVIDER=stub
PAYMENT_PROVIDER=stub
AI_SERVICE=stub
SEARCH_SERVICE=stub
NOTIFICATION_SERVICE=stub
```

- [ ] **Step 4: Run the full suite + lint + drift check**

Run: `cd api && ruff check . && pytest -q && python -m app.scripts.export_openapi`
Then: `git -C .. diff --exit-code docs/openapi.yaml`
Expected: ruff clean; all tests pass; **no diff** on `docs/openapi.yaml` (F4 added no routes).

- [ ] **Step 5: Commit**

```bash
git add api/tests/services/test_provider_isolation.py api/.env.example
git commit -m "F4: SDK-isolation guard + documented provider flags"
```

---

## Self-Review

**Spec coverage:**
- Six interfaces + stubs → Tasks 2–7. ✓
- Deferred live placeholders raising `NotImplementedError` → each provider's `live.py` (Tasks 2–7), proven by `test_live_provider_is_not_implemented`. ✓
- Pydantic result models → defined in each `base.py`. ✓
- Per-provider config flag, default stub → Task 1. ✓
- Factory + FastAPI deps, lazy live import → Task 8. ✓
- SDK-isolation guard → Task 9. ✓
- `.env.example` docs → Task 9. ✓
- No route/contract impact (drift check green) → verified in Task 9 Step 4. ✓
- `Platform` str-enum in `verification/base.py` → Task 3. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code. The `live.py` modules deliberately raise `NotImplementedError` — that is the intended deliverable, not a plan placeholder. ✓

**Type consistency:** `build_*`/`get_*` names in Task 8 match the registry usage; `Platform`/`VerifiedMetrics` produced in Task 3 are consumed in Task 6; stub class names (`StubAuthProvider`, etc.) consistent across tasks and registry. ✓

**Note for executor:** `pytest-asyncio` is already in `requirements-dev.txt`. Async tests use `@pytest.mark.asyncio`; if the suite is in strict asyncio mode and the marker errors, add `asyncio_mode = "auto"` under `[tool.pytest.ini_options]` in `pyproject.toml` (and drop the markers) — but try the markers first.
