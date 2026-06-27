from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_role_set
from app.models.influencer import InfluencerProfile, MetricSnapshot, SocialAccount
from app.models.user import Role, User
from app.schemas.influencer import (
    ConnectSocialRequest,
    ProfileResponse,
    ProfileUpdateRequest,
    SocialAccountOut,
)
from app.services.registry import get_verification_provider
from app.services.verification.base import VerificationProvider

router = APIRouter(prefix="/influencer", tags=["Influencer"])


async def _require_influencer(user: User = Depends(require_role_set)) -> User:
    if user.role != Role.influencer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Influencer role required"
        )
    return user


async def _get_profile_or_404(user: User, db: AsyncSession) -> InfluencerProfile:
    result = await db.execute(select(InfluencerProfile).where(InfluencerProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


async def _build_response(profile: InfluencerProfile, db: AsyncSession) -> ProfileResponse:
    """Build ProfileResponse by loading social_accounts via explicit SELECT.

    Never assigns to profile.social_accounts — that triggers SQLAlchemy lazy-load
    which raises in an async session.
    """
    acct_result = await db.execute(
        select(SocialAccount).where(SocialAccount.influencer_id == profile.id)
    )
    accounts = [SocialAccountOut.model_validate(a) for a in acct_result.scalars().all()]
    return ProfileResponse(
        user_id=profile.user_id,
        niche=profile.niche,
        bio=profile.bio,
        categories=profile.categories,
        verified=profile.verified,
        social_accounts=accounts,
    )


@router.get("/profile", response_model=ProfileResponse, summary="Get influencer profile")
async def get_profile(
    user: User = Depends(_require_influencer),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    profile = await _get_profile_or_404(user, db)
    return await _build_response(profile, db)


@router.put(
    "/profile", response_model=ProfileResponse, summary="Create or update influencer profile"
)
async def put_profile(
    body: ProfileUpdateRequest,
    user: User = Depends(_require_influencer),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    result = await db.execute(select(InfluencerProfile).where(InfluencerProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = InfluencerProfile(user_id=user.id)
        db.add(profile)

    profile.niche = body.niche
    profile.bio = body.bio
    profile.categories = body.categories
    await db.commit()
    await db.refresh(profile)

    return await _build_response(profile, db)


@router.post(
    "/profile/connect",
    response_model=ProfileResponse,
    summary="Connect Instagram or YouTube; fetches and stores verified metrics",
)
async def connect_social(
    body: ConnectSocialRequest,
    user: User = Depends(_require_influencer),
    db: AsyncSession = Depends(get_db),
    verification: VerificationProvider = Depends(get_verification_provider),
) -> ProfileResponse:
    profile = await _get_profile_or_404(user, db)

    metrics = await verification.fetch_metrics(body.platform, body.oauth_code)

    # Upsert social_accounts (one row per platform)
    acct_result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.influencer_id == profile.id,
            SocialAccount.platform == body.platform,
        )
    )
    acct = acct_result.scalar_one_or_none()
    if acct is None:
        acct = SocialAccount(influencer_id=profile.id, platform=body.platform)
        db.add(acct)

    acct.followers = metrics.followers
    acct.reach = metrics.reach
    acct.engagement_rate = metrics.engagement_rate
    acct.connected_at = datetime.now(timezone.utc)

    # Always append a new snapshot row (never upsert — history for fraud-delta)
    snap = MetricSnapshot(
        influencer_id=profile.id,
        platform=body.platform,
        followers=metrics.followers,
        reach=metrics.reach,
        engagement_rate=metrics.engagement_rate,
    )
    db.add(snap)

    # Verified badge is sticky: once True it is never cleared by a later reconnect.
    # A provider returning verified=False does not revoke an existing badge — that
    # requires an admin action (out of scope for P0).
    if metrics.verified:
        profile.verified = True

    await db.commit()
    await db.refresh(profile)

    return await _build_response(profile, db)
