from pydantic import BaseModel

from app.models.user import Role


class LoginRequest(BaseModel):
    firebase_token: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role | None
    role_set: bool


class SetRoleRequest(BaseModel):
    role: Role


class SetRoleResponse(BaseModel):
    role: Role
    role_set: bool


class MeResponse(BaseModel):
    firebase_uid: str
    email: str | None
    role: Role
    role_set: bool
