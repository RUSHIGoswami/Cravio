from app.services.auth.base import AuthIdentity, AuthProvider


class FirebaseAuthProvider(AuthProvider):
    """Live Firebase implementation. Wired in card A1 (do not import the SDK elsewhere)."""

    def __init__(self) -> None:
        raise NotImplementedError("FirebaseAuthProvider is wired in card A1")

    async def verify_id_token(self, id_token: str) -> AuthIdentity:
        raise NotImplementedError
