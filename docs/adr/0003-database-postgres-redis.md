# ADR-0003: PostgreSQL primary + Redis for cache/sessions

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0

## Context
The data is relational and transactional: users, profiles, campaigns, applications, payments, contracts, ratings. Payment and escrow flows demand strong consistency. Discovery needs filtering and full-text/trigram search at MVP. We also need fast session lookups and caching for verified-metrics reads.

## Decision
PostgreSQL as the primary store; Redis for caching, sessions, and rate-limit counters. Use Postgres full-text + `pg_trgm` for MVP search (see ADR-0009). Plan for read replicas as load grows.

## Rationale
- ACID transactions are non-negotiable for escrow/payout and contract state.
- Postgres covers discovery filtering and trigram search natively at MVP, deferring a separate search dependency.
- Redis offloads hot reads (verified metrics, feeds) and backs sessions and rate limiting, protecting p95 latency.

## Alternatives considered
- **MongoDB:** flexible documents, but weaker multi-document transactional guarantees for payments and more modeling discipline needed for relational data.
- **MySQL:** viable, but Postgres's full-text, trigram, JSONB, and extension ecosystem fit our discovery needs better.

## Consequences
- Cache invalidation strategy required for verified-metrics and feed data (TTL + event-based busting).
- Migrations are first-class (Alembic) and run in CI; schema changes ship with migrations.
- Read replicas and connection pooling (PgBouncer) are the first scaling levers when p95 degrades.
