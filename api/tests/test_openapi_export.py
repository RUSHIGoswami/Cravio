import yaml

from app.scripts.export_openapi import OUTPUT_PATH, render_openapi


def test_render_includes_health_path_and_schema():
    spec = yaml.safe_load(render_openapi())

    assert spec["openapi"].startswith("3.")
    assert spec["info"]["title"] == "Cravio API"
    assert "/health" in spec["paths"]
    assert "Health" in spec["components"]["schemas"]
    props = spec["components"]["schemas"]["Health"]["properties"]
    assert {"status", "db", "redis"} <= set(props)


def test_render_is_deterministic():
    # Stable key ordering keeps committed diffs clean and the drift check reliable.
    assert render_openapi() == render_openapi()


def test_committed_spec_matches_generated():
    # F3 drift guard. docs/openapi.yaml is a generated artifact — regenerate with
    # `python -m app.scripts.export_openapi` whenever routes or schemas change.
    committed = OUTPUT_PATH.read_text(encoding="utf-8")
    assert committed == render_openapi(), (
        "docs/openapi.yaml is stale — run `python -m app.scripts.export_openapi`"
    )
