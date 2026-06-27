from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_role_set
from app.models.brand import BrandProfile
from app.models.user import Role, User
from app.schemas.brand import (
    BrandProfileResponse,
    BrandProfileUpdateRequest,
    CampaignBuilderAccessResponse,
)

router = APIRouter(prefix="/brand", tags=["Brand"])


async def _require_brand(user: User = Depends(require_role_set)) -> User:
    if user.role != Role.brand:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brand role required")
    return user


async def _get_profile(user: User, db: AsyncSession) -> BrandProfile | None:
    result = await db.execute(select(BrandProfile).where(BrandProfile.user_id == user.id))
    return result.scalar_one_or_none()


@router.get("/profile", response_model=BrandProfileResponse, summary="Get brand profile")
async def get_profile(
    user: User = Depends(_require_brand),
    db: AsyncSession = Depends(get_db),
) -> BrandProfileResponse:
    profile = await _get_profile(user, db)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return BrandProfileResponse.model_validate(profile)


@router.put(
    "/profile", response_model=BrandProfileResponse, summary="Create or update brand profile"
)
async def put_profile(
    body: BrandProfileUpdateRequest,
    user: User = Depends(_require_brand),
    db: AsyncSession = Depends(get_db),
) -> BrandProfileResponse:
    profile = await _get_profile(user, db)
    if profile is None:
        profile = BrandProfile(user_id=user.id)
        db.add(profile)

    profile.company_name = body.company_name
    profile.industry = body.industry
    profile.website = body.website
    profile.gst = body.gst
    await db.commit()
    await db.refresh(profile)

    return BrandProfileResponse.model_validate(profile)


@router.get(
    "/campaign-builder",
    response_model=CampaignBuilderAccessResponse,
    summary="Brand-only gate confirming the caller can reach the campaign builder",
)
async def campaign_builder_access(
    user: User = Depends(_require_brand),
    db: AsyncSession = Depends(get_db),
) -> CampaignBuilderAccessResponse:
    """Server-enforced brand gate (A5 AC2). `_require_brand` 403s influencers;
    `profile_complete` tells the client whether brand setup is done so it can route
    straight into the builder (C1) or back to profile setup."""
    profile = await _get_profile(user, db)
    return CampaignBuilderAccessResponse(
        can_create_campaign=True, profile_complete=profile is not None
    )
