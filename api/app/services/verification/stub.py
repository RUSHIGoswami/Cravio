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
