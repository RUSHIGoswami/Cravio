import pytest

from app.services.notification.base import (
    DevicePlatform,
    NotificationService,
    PushMessage,
    PushResult,
)
from app.services.notification.live import FcmNotificationService
from app.services.notification.stub import StubNotificationService


@pytest.mark.asyncio
async def test_stub_send_push_is_deterministic():
    result = await StubNotificationService().send_push(
        PushMessage(token="dev-1", title="Hi", body="You were selected")
    )
    assert isinstance(result, PushResult)
    assert result.id == "stub_push_dev-1"
    assert result.delivered is True


@pytest.mark.asyncio
async def test_stub_register_and_prune_are_noops():
    svc = StubNotificationService()
    assert await svc.register_device_token("user-1", "dev-1", DevicePlatform.ios) is None
    assert await svc.prune_token("dev-1") is None


def test_stub_is_a_notification_service():
    assert isinstance(StubNotificationService(), NotificationService)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        FcmNotificationService()
