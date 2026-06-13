"""
Pydantic schemas used for API request/response validation.
"""

from datetime import date
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class LineItem(BaseModel):
    """A single line item on a receipt."""

    description: str = Field(..., min_length=1, description="Item description")
    price: float = Field(..., ge=0, description="Item price in USD")


class ExpenseCreate(BaseModel):
    """Schema for creating a new expense (incoming request body)."""

    merchant: str = Field(..., min_length=1, description="Merchant / vendor name")
    purchase_date: date = Field(..., description="Date of purchase (YYYY-MM-DD)")
    line_items: List[LineItem] = Field(
        default_factory=list, description="Individual line items from the receipt"
    )
    total: float = Field(..., ge=0, description="Total amount in USD")
    tax: Optional[float] = Field(None, ge=0, description="Tax amount in USD")

    @field_validator("merchant")
    @classmethod
    def merchant_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("merchant must not be blank")
        return v.strip()


class ExpenseResponse(ExpenseCreate):
    """Schema returned after creating or retrieving an expense."""

    id: int = Field(..., description="Server-generated unique identifier")
    category: str = Field(..., description="Inferred expense category")

    model_config = {"from_attributes": True}


class SummaryResponse(BaseModel):
    """Schema for the monthly expense summary endpoint."""

    month: str = Field(..., description="Month in YYYY-MM format")
    total_expenses: float = Field(..., description="Sum of all expense totals")
    category_summary: Dict[str, float] = Field(
        ..., description="Total spent per category"
    )
