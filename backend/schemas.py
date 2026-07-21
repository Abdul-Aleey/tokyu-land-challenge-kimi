"""Pydantic response/request models for the API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class RiskOut(BaseModel):
    score: int
    level: str
    reasons: list[str]
    days_to_renewal: int | None


class CompanyOut(BaseModel):
    id: int
    name: str
    industry: str
    membership_plan: str
    contract_status: str
    renewal_date: str
    payment_status: str
    invoice_request_status: str
    monthly_fee_jpy: int
    updated_at: str
    risk: RiskOut


class ActivityEventOut(BaseModel):
    id: int
    event_type: str
    event_date: str
    description: str


class CompanyDetailOut(CompanyOut):
    name_kana: str | None
    contact_person: str | None
    contact_email: str | None
    contact_phone: str | None
    contract_start_date: str
    last_payment_date: str | None
    invoice_sent_date: str | None
    notes: str | None
    timeline: list[ActivityEventOut]


class StatusUpdateRequest(BaseModel):
    contract_status: str | None = None
    payment_status: str | None = None
    invoice_request_status: str | None = None


class CompanyWriteRequest(BaseModel):
    """Full create/modify payload -- every field staff can set from the Add/Modify form.

    last_payment_date/invoice_sent_date are optional overrides (e.g. backdating);
    when omitted the backend derives them from payment_status/invoice_request_status
    (today's date on a transition to Paid/Sent, cleared to null otherwise)."""

    name: str = Field(min_length=1)
    name_kana: str | None = None
    industry: str = Field(min_length=1)
    membership_plan: str = Field(min_length=1)
    contact_person: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    contract_status: str
    contract_start_date: str
    renewal_date: str
    payment_status: str
    last_payment_date: str | None = None
    monthly_fee_jpy: int = Field(ge=0)
    invoice_request_status: str
    invoice_sent_date: str | None = None
    notes: str | None = None


class AnalyticsSummary(BaseModel):
    total_companies: int
    active_contracts: int
    pending_renewal: int
    renewals_due_30d: int
    payments_late: int
    payments_not_paid: int
    invoices_not_sent: int
    at_risk_count: int
    contract_status_breakdown: dict[str, int]
    payment_status_breakdown: dict[str, int]
    invoice_status_breakdown: dict[str, int]


class RenewalMonthBucket(BaseModel):
    month: str
    count: int


class RiskRadarItem(BaseModel):
    id: int
    name: str
    industry: str
    risk: RiskOut


class CompanySuggestion(BaseModel):
    id: int
    name: str
    industry: str


class SegmentBucket(BaseModel):
    key: str
    total: int
    active: int
    pending_renewal: int
    expired: int
    cancelled: int
    payments_late: int
    invoices_not_sent: int
    at_risk_count: int


class SegmentationOut(BaseModel):
    by_industry: list[SegmentBucket]
    by_plan: list[SegmentBucket]
