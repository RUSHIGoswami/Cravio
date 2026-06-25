"""Export the FastAPI-generated OpenAPI schema to docs/openapi.yaml.

`docs/openapi.yaml` is a generated artifact (ADR-0001, card F3): regenerate it
with `python -m app.scripts.export_openapi` whenever routes or schemas change.
CI runs the same command and fails the build if the committed file drifts.

The export reads route and Pydantic metadata only — it never opens a database or
Redis connection — so harmless placeholder URLs are provided when the real
configuration is absent (e.g. a clean CI checkout running just this step).
"""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://localhost/cravio")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

from pathlib import Path  # noqa: E402

import yaml  # noqa: E402

from app.main import app  # noqa: E402

# api/app/scripts/export_openapi.py -> repo root -> docs/openapi.yaml
OUTPUT_PATH = Path(__file__).resolve().parents[3] / "docs" / "openapi.yaml"


def render_openapi() -> str:
    """Render the OpenAPI schema as YAML with stable key ordering for clean diffs."""
    schema = app.openapi()
    return yaml.safe_dump(
        schema,
        sort_keys=True,
        allow_unicode=True,
        default_flow_style=False,
    )


def main() -> None:
    OUTPUT_PATH.write_text(render_openapi(), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
