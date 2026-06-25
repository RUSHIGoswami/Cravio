import abc


class AIService(abc.ABC):
    @abc.abstractmethod
    async def generate_text(self, prompt: str, *, max_tokens: int = 512) -> str:
        """Generate text from a prompt."""
