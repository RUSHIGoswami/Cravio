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
