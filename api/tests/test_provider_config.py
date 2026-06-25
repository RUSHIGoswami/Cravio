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
