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
