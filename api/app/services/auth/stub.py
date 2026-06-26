from app.services.auth.base import AuthIdentity, AuthProvider, InvalidTokenError


class StubAuthProvider(AuthProvider):
    async def verify_id_token(self, id_token: str) -> AuthIdentity:
        if not id_token:
            raise ValueError("id_token must not be empty")
        if id_token.startswith("invalid.") or id_token.startswith("expired."):
            raise InvalidTokenError(f"stub: token rejected: {id_token!r}")
        uid = f"stub-uid-{id_token}"
        return AuthIdentity(uid=uid, email=f"{uid}@stub.cravio.in", email_verified=True)
