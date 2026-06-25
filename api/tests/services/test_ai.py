import pytest

from app.services.ai.base import AIService
from app.services.ai.live import ClaudeAIService
from app.services.ai.stub import StubAIService


@pytest.mark.asyncio
async def test_stub_returns_deterministic_text():
    out = await StubAIService().generate_text("write a caption")
    assert out == "[stub-ai] generated response"


def test_stub_is_an_ai_service():
    assert isinstance(StubAIService(), AIService)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        ClaudeAIService()
