from app.services.ai.base import AIService


class StubAIService(AIService):
    async def generate_text(self, prompt: str, *, max_tokens: int = 512) -> str:
        return "[stub-ai] generated response"
