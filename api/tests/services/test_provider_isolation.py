import re
from pathlib import Path

SERVICES_DIR = Path(__file__).resolve().parents[2] / "app" / "services"
VENDOR_SDKS = (
    "firebase_admin",
    "razorpay",
    "anthropic",
    "googleapiclient",
    "google.oauth2",
    "google.auth",
)


def test_no_vendor_sdk_imported_outside_live_modules():
    offenders = []
    for path in SERVICES_DIR.rglob("*.py"):
        if path.name == "live.py":
            continue
        text = path.read_text(encoding="utf-8")
        for sdk in VENDOR_SDKS:
            pattern = rf"^\s*(?:import|from)\s+{re.escape(sdk)}\b"
            if re.search(pattern, text, re.MULTILINE):
                offenders.append(f"{path.relative_to(SERVICES_DIR)} imports {sdk}")
    assert offenders == [], f"vendor SDK imported outside live.py: {offenders}"


def test_isolation_check_actually_scans_files():
    # Guard against the scan silently finding nothing because the path is wrong.
    scanned = list(SERVICES_DIR.rglob("*.py"))
    assert len(scanned) >= 12
