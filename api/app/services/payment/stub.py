import json

from app.services.payment.base import (
    PaymentProvider,
    PayoutRequest,
    PayoutResult,
    PayoutStatus,
    WebhookEvent,
)


class StubPaymentProvider(PaymentProvider):
    async def create_payout(self, request: PayoutRequest) -> PayoutResult:
        return PayoutResult(
            id=f"stub_payout_{request.reference}",
            status=PayoutStatus.processing,
            amount_inr=request.amount_inr,
            method=request.method,
        )

    async def verify_webhook(self, payload: bytes, signature: str) -> WebhookEvent:
        data = json.loads(payload or b"{}")
        return WebhookEvent(event=data.get("event", "stub.event"), verified=True, payload=data)
