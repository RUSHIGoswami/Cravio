import abc
import enum

from pydantic import BaseModel


class PayoutMethod(str, enum.Enum):
    upi = "upi"
    bank = "bank"
    paytm = "paytm"


class PayoutStatus(str, enum.Enum):
    initiated = "initiated"
    processing = "processing"
    paid = "paid"
    failed = "failed"


class PayoutRequest(BaseModel):
    amount_inr: int
    method: PayoutMethod
    reference: str


class PayoutResult(BaseModel):
    id: str
    status: PayoutStatus
    amount_inr: int
    method: PayoutMethod


class WebhookEvent(BaseModel):
    event: str
    verified: bool
    payload: dict


class PaymentProvider(abc.ABC):
    @abc.abstractmethod
    async def create_payout(self, request: PayoutRequest) -> PayoutResult:
        """Initiate a payout to an influencer."""

    @abc.abstractmethod
    async def verify_webhook(self, payload: bytes, signature: str) -> WebhookEvent:
        """Verify a payment webhook signature and return the parsed event."""
