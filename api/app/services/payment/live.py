from app.services.payment.base import (
    PaymentProvider,
    PayoutRequest,
    PayoutResult,
    WebhookEvent,
)


class RazorpayPaymentProvider(PaymentProvider):
    """Live Razorpay implementation. Wired in card P1 (SDK imports stay in this module)."""

    def __init__(self) -> None:
        raise NotImplementedError("RazorpayPaymentProvider is wired in card P1")

    async def create_payout(self, request: PayoutRequest) -> PayoutResult:
        raise NotImplementedError

    async def verify_webhook(self, payload: bytes, signature: str) -> WebhookEvent:
        raise NotImplementedError
