# ADR-0009: Postgres full-text + trigram for MVP search, Algolia at scale

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0 (decision) / Phase 1 (Postgres) / later (Algolia)

## Context
Influencer discovery needs filtering (niche, city, follower range, engagement, platform, language) plus name/keyword matching. At MVP volumes Postgres handles this; a dedicated search service is premature spend pre-revenue.

## Decision
Use PostgreSQL full-text search + `pg_trgm` for discovery at MVP. Encapsulate search behind a `SearchService` interface so Algolia (or OpenSearch) can replace it at scale without touching call sites.

## Rationale
- Avoids a second datastore and its sync complexity while volumes are low.
- Trigram indexes give fuzzy name matching; structured filters are plain indexed SQL.
- The interface makes the future swap a contained change.

## Alternatives considered
- **Algolia from day one:** great relevance/UX but recurring cost and a sync pipeline we don't need yet.
- **OpenSearch/Elasticsearch:** powerful but heavy to operate solo at MVP.

## Consequences
- Must build and tune GIN/trigram indexes; watch query plans as data grows.
- Define the migration trigger explicitly (e.g. discovery p95 latency or result-quality complaints) so the Algolia move is a decision, not a fire drill.
- Search results feed the AI-match feature later (ADR-0007); keep ranking logic isolated.
