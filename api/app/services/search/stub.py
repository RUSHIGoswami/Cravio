from app.services.search.base import (
    InfluencerCard,
    InfluencerPage,
    InfluencerQuery,
    SearchService,
)


class StubSearchService(SearchService):
    async def search_influencers(self, query: InfluencerQuery) -> InfluencerPage:
        items = [
            InfluencerCard(
                id="stub-influencer-1",
                handle="@stub_creator",
                niche=["fashion"],
                city="Mumbai",
                verified=True,
                metrics=None,
            )
        ]
        return InfluencerPage(
            items=items,
            page=query.page,
            page_size=query.page_size,
            total=len(items),
        )
