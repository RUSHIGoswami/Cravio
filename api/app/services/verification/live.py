from app.services.verification.base import Platform, VerificationProvider, VerifiedMetrics


class MetaYouTubeVerificationProvider(VerificationProvider):
    """Live Meta/YouTube implementation. Wired in card A3 (SDK imports stay in this module)."""

    def __init__(self) -> None:
        raise NotImplementedError("MetaYouTubeVerificationProvider is wired in card A3")

    async def fetch_metrics(self, platform: Platform, oauth_code: str) -> VerifiedMetrics:
        raise NotImplementedError
