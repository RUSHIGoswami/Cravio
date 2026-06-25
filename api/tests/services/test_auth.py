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
