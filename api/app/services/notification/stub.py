from app.services.notification.base import (
    DevicePlatform,
    NotificationService,
    PushMessage,
    PushResult,
)


class StubNotificationService(NotificationService):
    async def send_push(self, message: PushMessage) -> PushResult:
        return PushResult(id=f"stub_push_{message.token}", delivered=True)

    async def register_device_token(
        self, user_id: str, token: str, platform: DevicePlatform
    ) -> None:
        return None

    async def prune_token(self, token: str) -> None:
        return None
