from app.services.auth.base import AuthIdentity, AuthProvider


class StubAuthProvider(AuthProvider):
    async def verify_id_token(self, id_token: str) -> AuthIdentity:
        if not id_token:
            raise ValueError("id_token must not be empty")
        uid = f"stub-uid-{id_token}"
        return AuthIdentity(uid=uid, email=f"{uid}@stub.cravio.in", email_verified=True)
