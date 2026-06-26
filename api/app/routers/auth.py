import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role_set
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    SetRoleRequest,
    SetRoleResponse,
)
from app.services.auth.base import AuthProvider, InvalidTokenError
from app.services.registry import get_auth_provider

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/login", response_model=LoginResponse, summary="Exchange Firebase ID token for internal JWT"
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
    auth_provider: AuthProvider = Depends(get_auth_provider),
) -> LoginResponse:
    try:
        identity = await auth_provider.verify_id_token(body.firebase_token)
    except (InvalidTokenError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token is invalid or expired",
        )

    result = await db.execute(select(User).where(User.firebase_uid == identity.uid))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            id=uuid.uuid4(),
            firebase_uid=identity.uid,
            email=identity.email or f"{identity.uid}@unknown.cravio.in",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return LoginResponse(
        access_token=create_access_token(sub=identity.uid),
        role=user.role,
        role_set=user.role_set,
    )


@router.post("/role", response_model=SetRoleResponse, summary="Set role once during onboarding")
async def set_role(
    body: SetRoleRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SetRoleResponse:
    if user.role_set:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role already set and cannot be changed",
        )

    user.role = body.role
    user.role_set = True
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return SetRoleResponse(role=user.role, role_set=user.role_set)


@router.get("/me", response_model=MeResponse, summary="Get current user (requires role set)")
async def me(user: User = Depends(require_role_set)) -> MeResponse:
    return MeResponse(
        firebase_uid=user.firebase_uid,
        email=user.email,
        role=user.role,
        role_set=user.role_set,
    )
