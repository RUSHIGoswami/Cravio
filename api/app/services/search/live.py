from app.services.search.base import InfluencerPage, InfluencerQuery, SearchService


class PostgresSearchService(SearchService):
    """Live Postgres FTS/trigram implementation. Wired in card D1."""

    def __init__(self) -> None:
        raise NotImplementedError("PostgresSearchService is wired in card D1")

    async def search_influencers(self, query: InfluencerQuery) -> InfluencerPage:
        raise NotImplementedError
