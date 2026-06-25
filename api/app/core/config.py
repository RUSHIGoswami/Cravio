from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

ProviderMode = Literal["stub", "live"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    redis_url: str

    auth_provider: ProviderMode = "stub"
    verification_provider: ProviderMode = "stub"
    payment_provider: ProviderMode = "stub"
    ai_service: ProviderMode = "stub"
    search_service: ProviderMode = "stub"
    notification_service: ProviderMode = "stub"


settings = Settings()
