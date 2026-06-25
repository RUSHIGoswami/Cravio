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
