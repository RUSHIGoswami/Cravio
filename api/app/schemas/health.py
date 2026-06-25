from pydantic import BaseModel, Field


class Health(BaseModel):
    """Service health probe response."""

    status: str = Field(examples=["ok"])
    db: bool
    redis: bool
