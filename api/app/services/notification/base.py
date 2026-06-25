import abc
import enum

from pydantic import BaseModel


class DevicePlatform(str, enum.Enum):
    ios = "ios"
    android = "android"


class PushMessage(BaseModel):
    token: str
    title: str
    body: str


class PushResult(BaseModel):
    id: str
    delivered: bool


class NotificationService(abc.ABC):
    @abc.abstractmethod
    async def send_push(self, message: PushMessage) -> PushResult:
        """Send a push notification to a device."""

    @abc.abstractmethod
    async def register_device_token(
        self, user_id: str, token: str, platform: DevicePlatform
    ) -> None:
        """Register or refresh a device token for a user."""

    @abc.abstractmethod
    async def prune_token(self, token: str) -> None:
        """Remove a stale/invalid device token."""
