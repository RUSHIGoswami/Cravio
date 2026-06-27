import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.services.verification.base import Platform


class ProfileUpdateRequest(BaseModel):
    niche: str | None = Field(None, max_length=120)
    bio: str | None = Field(None, max_length=500)
    categories: list[str] = Field(default_factory=list, max_length=10)


class ConnectSocialRequest(BaseModel):
    platform: Platform
    oauth_code: str

    @field_validator("oauth_code")
    @classmethod
    def code_non_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("oauth_code must not be empty")
        return v


class SocialAccountOut(BaseModel):
    platform: Platform
    followers: int
    reach: int
    engagement_rate: float
    connected_at: datetime

    model_config = {"from_attributes": True}


class MetricSnapshotOut(BaseModel):
    platform: Platform
    followers: int
    reach: int
    engagement_rate: float
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    user_id: uuid.UUID
    niche: str | None
    bio: str | None
    categories: list[str]
    verified: bool
    social_accounts: list[SocialAccountOut] = []

    model_config = {"from_attributes": True}
