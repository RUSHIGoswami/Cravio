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
