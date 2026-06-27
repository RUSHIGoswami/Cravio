import pytest
from pydantic import ValidationError

from app.schemas.influencer import ConnectSocialRequest, ProfileUpdateRequest
from app.services.verification.base import Platform


def test_profile_update_valid():
    req = ProfileUpdateRequest(niche="fitness", bio="hello", categories=["health"])
    assert req.niche == "fitness"
    assert req.categories == ["health"]


def test_profile_update_niche_too_long():
    with pytest.raises(ValidationError):
        ProfileUpdateRequest(niche="x" * 121, bio=None, categories=[])


def test_profile_update_bio_too_long():
    with pytest.raises(ValidationError):
        ProfileUpdateRequest(niche=None, bio="x" * 501, categories=[])


def test_profile_update_too_many_categories():
    with pytest.raises(ValidationError):
        ProfileUpdateRequest(niche=None, bio=None, categories=[f"cat{i}" for i in range(11)])


def test_connect_social_valid():
    req = ConnectSocialRequest(platform=Platform.instagram, oauth_code="abc123")
    assert req.platform == Platform.instagram


def test_connect_social_empty_code_rejected():
    with pytest.raises(ValidationError):
        ConnectSocialRequest(platform=Platform.youtube, oauth_code="")
