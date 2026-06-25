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
