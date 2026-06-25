from app.services.notification.base import (
    DevicePlatform,
    NotificationService,
    PushMessage,
    PushResult,
)


class FcmNotificationService(NotificationService):
    """Live Firebase Cloud Messaging implementation. Wired in card G1 (SDK imports stay here)."""

    def __init__(self) -> None:
        raise NotImplementedError("FcmNotificationService is wired in card G1")

    async def send_push(self, message: PushMessage) -> PushResult:
        raise NotImplementedError

    async def register_device_token(
        self, user_id: str, token: str, platform: DevicePlatform
    ) -> None:
        raise NotImplementedError

    async def prune_token(self, token: str) -> None:
        raise NotImplementedError
