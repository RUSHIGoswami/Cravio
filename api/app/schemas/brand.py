import re
import uuid

from pydantic import BaseModel, Field, field_validator

# Indian GSTIN: 2-digit state code, 5 letters (PAN block), 4 digits, 1 letter,
# 1 entity char, literal 'Z', 1 checksum char. Total 15 chars.
_GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
# Minimal http(s) URL check — scheme + host. Avoids HttpUrl's trailing-slash
# normalisation so the stored value round-trips exactly as entered.
_URL_RE = re.compile(r"^https?://[^\s/$.?#][^\s]*$", re.IGNORECASE)


class BrandProfileUpdateRequest(BaseModel):
    company_name: str = Field(min_length=1, max_length=160)
    industry: str = Field(min_length=1, max_length=80)
    website: str = Field(max_length=255)
    gst: str | None = Field(default=None, max_length=15)

    @field_validator("company_name", "industry")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()

    @field_validator("website")
    @classmethod
    def valid_url(cls, v: str) -> str:
        v = v.strip()
        if not _URL_RE.match(v):
            raise ValueError("website must be a valid http(s) URL")
        return v

    @field_validator("gst")
    @classmethod
    def valid_gst(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().upper()
        if not v:
            return None
        if not _GSTIN_RE.match(v):
            raise ValueError("gst must be a valid 15-character GSTIN")
        return v


class BrandProfileResponse(BaseModel):
    user_id: uuid.UUID
    company_name: str
    industry: str
    website: str
    gst: str | None

    model_config = {"from_attributes": True}


class CampaignBuilderAccessResponse(BaseModel):
    can_create_campaign: bool
    profile_complete: bool
