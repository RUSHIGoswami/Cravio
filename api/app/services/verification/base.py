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
