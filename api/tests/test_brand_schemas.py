"""Tests for A5: Brand profile schema validation.

Acceptance criterion 1 (validation half): brand profile validates;
company name / industry / website are required, GST is optional and,
when present, must be a well-formed Indian GSTIN.
"""

import pytest
from pydantic import ValidationError

from app.schemas.brand import BrandProfileUpdateRequest

VALID_GSTIN = "22AAAAA0000A1Z5"


def test_valid_full_payload():
    req = BrandProfileUpdateRequest(
        company_name="Acme Foods",
        industry="FMCG",
        website="https://acme.example.in",
        gst=VALID_GSTIN,
    )
    assert req.company_name == "Acme Foods"
    assert req.industry == "FMCG"
    assert req.website == "https://acme.example.in"
    assert req.gst == VALID_GSTIN


def test_gst_optional_when_omitted():
    req = BrandProfileUpdateRequest(
        company_name="Acme", industry="Tech", website="https://acme.example.in"
    )
    assert req.gst is None


def test_gst_empty_string_normalised_to_none():
    req = BrandProfileUpdateRequest(
        company_name="Acme", industry="Tech", website="https://acme.example.in", gst="  "
    )
    assert req.gst is None


def test_gst_lowercase_is_uppercased():
    req = BrandProfileUpdateRequest(
        company_name="Acme",
        industry="Tech",
        website="https://acme.example.in",
        gst=VALID_GSTIN.lower(),
    )
    assert req.gst == VALID_GSTIN


def test_invalid_gst_rejected():
    with pytest.raises(ValidationError):
        BrandProfileUpdateRequest(
            company_name="Acme", industry="Tech", website="https://acme.example.in", gst="NOTAGST"
        )


def test_blank_company_name_rejected():
    with pytest.raises(ValidationError):
        BrandProfileUpdateRequest(
            company_name="   ", industry="Tech", website="https://acme.example.in"
        )


def test_missing_company_name_rejected():
    payload = {"industry": "Tech", "website": "https://acme.example.in"}
    with pytest.raises(ValidationError):
        BrandProfileUpdateRequest(**payload)


def test_company_name_too_long_rejected():
    with pytest.raises(ValidationError):
        BrandProfileUpdateRequest(
            company_name="x" * 161, industry="Tech", website="https://acme.example.in"
        )


def test_website_without_scheme_rejected():
    with pytest.raises(ValidationError):
        BrandProfileUpdateRequest(company_name="Acme", industry="Tech", website="acme.example.in")


def test_website_required():
    payload = {"company_name": "Acme", "industry": "Tech"}
    with pytest.raises(ValidationError):
        BrandProfileUpdateRequest(**payload)
