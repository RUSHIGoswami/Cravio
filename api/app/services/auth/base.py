import abc

from pydantic import BaseModel


class InvalidTokenError(Exception):
    """Raised when a token is invalid, expired, or cannot be verified."""


class AuthIdentity(BaseModel):
    """Identity resolved from a verified auth token."""

    uid: str
    email: str | None = None
    email_verified: bool = False


class AuthProvider(abc.ABC):
    @abc.abstractmethod
    async def verify_id_token(self, id_token: str) -> AuthIdentity:
        """Verify an auth ID token and return the caller's identity.

        Raises InvalidTokenError for invalid or expired tokens.
        Raises ValueError for empty tokens.
        """
