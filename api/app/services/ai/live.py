from app.services.ai.base import AIService


class ClaudeAIService(AIService):
    """Live Claude implementation. Wired in a later AI feature card (SDK imports stay here)."""

    def __init__(self) -> None:
        raise NotImplementedError("ClaudeAIService is wired in a later AI feature card")

    async def generate_text(self, prompt: str, *, max_tokens: int = 512) -> str:
        raise NotImplementedError
