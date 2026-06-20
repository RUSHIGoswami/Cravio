# ADR-0006: AWS S3 + CloudFront for media storage and delivery

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0

## Context
Profile images and content samples must be stored durably and served fast across India (<2s app load on 4G). Uploads should not pass through our API servers.

## Decision
Store media in AWS S3; serve through CloudFront CDN. Mobile/admin clients upload directly to S3 via short-lived pre-signed URLs minted by the API.

## Rationale
- Pre-signed direct uploads keep large media off our request path, protecting API latency.
- CloudFront edge caching meets the 4G load-time target across India.
- S3 durability and lifecycle policies are cheap and well-understood.

## Alternatives considered
- **Cloudflare R2:** no egress fees and attractive, but we are already on AWS for the rest of infra; revisit if CDN/egress costs dominate.
- **GCS + Cloud CDN:** viable but splits cloud vendors with our AWS infra (ADR-0011/infra).

## Consequences
- API must mint scoped, expiring pre-signed URLs and validate content type/size server-side.
- Need image processing (resize/transcode) — start with on-upload Lambda or a worker; defer until needed.
- Bucket policies and CloudFront signed URLs/cookies required for any private content.
