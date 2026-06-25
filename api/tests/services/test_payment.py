import pytest

from app.services.payment.base import (
    PaymentProvider,
    PayoutMethod,
    PayoutRequest,
    PayoutResult,
    PayoutStatus,
    WebhookEvent,
)
from app.services.payment.live import RazorpayPaymentProvider
from app.services.payment.stub import StubPaymentProvider


@pytest.mark.asyncio
async def test_stub_create_payout_is_deterministic():
    req = PayoutRequest(amount_inr=5000, method=PayoutMethod.upi, reference="app-1")
    result = await StubPaymentProvider().create_payout(req)
    assert isinstance(result, PayoutResult)
    assert result.id == "stub_payout_app-1"
    assert result.status == PayoutStatus.processing
    assert result.amount_inr == 5000
    assert result.method == PayoutMethod.upi


@pytest.mark.asyncio
async def test_stub_verify_webhook_parses_and_trusts():
    event = await StubPaymentProvider().verify_webhook(b'{"event": "payout.paid"}', "sig")
    assert isinstance(event, WebhookEvent)
    assert event.event == "payout.paid"
    assert event.verified is True
    assert event.payload == {"event": "payout.paid"}


def test_stub_is_a_payment_provider():
    assert isinstance(StubPaymentProvider(), PaymentProvider)


def test_live_provider_is_not_implemented():
    with pytest.raises(NotImplementedError):
        RazorpayPaymentProvider()
