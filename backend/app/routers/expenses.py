"""
Expenses router — implements all /expenses endpoints.
"""

import re
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.orm_models import ExpenseORM, LineItemORM
from app.schemas import ExpenseCreate, ExpenseResponse, SummaryResponse
from app.services.category import infer_category
from app.services.export import generate_csv

router = APIRouter(prefix="/expenses", tags=["expenses"])


# ---------------------------------------------------------------------------
# Helper: parse "YYYY-MM" query parameter
# ---------------------------------------------------------------------------

def _parse_month(month: str) -> tuple[int, int]:
    """Validate and split 'YYYY-MM' into (year, month) integers."""
    pattern = re.compile(r"^(\d{4})-(\d{2})$")
    match = pattern.match(month)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="month must be in YYYY-MM format",
        )
    year, mon = int(match.group(1)), int(match.group(2))
    if not (1 <= mon <= 12):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="month value must be between 01 and 12",
        )
    return year, mon


def _orm_to_schema(orm_obj: ExpenseORM) -> ExpenseResponse:
    """Convert an ORM model instance to a Pydantic response schema."""
    return ExpenseResponse(
        id=orm_obj.id,
        merchant=orm_obj.merchant,
        purchase_date=orm_obj.purchase_date,
        line_items=[
            {"description": li.description, "price": li.price}
            for li in orm_obj.line_items
        ],
        total=orm_obj.total,
        tax=orm_obj.tax,
        category=orm_obj.category,
    )


# ---------------------------------------------------------------------------
# POST /expenses
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense",
)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    """
    Accept a validated expense payload, infer its category from the
    merchant name, persist it (with line items) to the database, and
    return the newly created record.
    """
    category = infer_category(payload.merchant)

    expense_orm = ExpenseORM(
        merchant=payload.merchant,
        purchase_date=payload.purchase_date,
        total=payload.total,
        tax=payload.tax,
        category=category,
    )

    for item in payload.line_items:
        line_item_orm = LineItemORM(
            description=item.description,
            price=item.price,
        )
        expense_orm.line_items.append(line_item_orm)

    db.add(expense_orm)
    db.commit()
    db.refresh(expense_orm)

    return _orm_to_schema(expense_orm)


# ---------------------------------------------------------------------------
# GET /expenses
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[ExpenseResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve all expenses",
)
def list_expenses(db: Session = Depends(get_db)):
    """Return every expense stored in the database, newest first."""
    expenses = (
        db.query(ExpenseORM)
        .order_by(ExpenseORM.purchase_date.desc(), ExpenseORM.id.desc())
        .all()
    )
    return [_orm_to_schema(e) for e in expenses]


# ---------------------------------------------------------------------------
# GET /expenses/summary
# ---------------------------------------------------------------------------

@router.get(
    "/summary",
    response_model=SummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Monthly expense summary grouped by category",
)
def get_summary(
    month: str = Query(..., description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
):
    """
    Return the total spend and a per-category breakdown for the given month.
    """
    year, mon = _parse_month(month)

    rows = (
        db.query(ExpenseORM.category, func.sum(ExpenseORM.total).label("total"))
        .filter(
            extract("year", ExpenseORM.purchase_date) == year,
            extract("month", ExpenseORM.purchase_date) == mon,
        )
        .group_by(ExpenseORM.category)
        .all()
    )

    category_summary = {row.category: round(row.total, 2) for row in rows}
    total_expenses = round(sum(category_summary.values()), 2)

    return SummaryResponse(
        month=month,
        total_expenses=total_expenses,
        category_summary=category_summary,
    )


# ---------------------------------------------------------------------------
# GET /expenses/export
# ---------------------------------------------------------------------------

@router.get(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export a month's expenses as a CSV file",
    response_class=StreamingResponse,
)
def export_expenses(
    month: str = Query(..., description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
):
    """
    Stream a CSV file containing all expenses for the given month.
    The response triggers a file download in the browser / HTTP client.
    """
    year, mon = _parse_month(month)

    expenses = (
        db.query(ExpenseORM)
        .filter(
            extract("year", ExpenseORM.purchase_date) == year,
            extract("month", ExpenseORM.purchase_date) == mon,
        )
        .order_by(ExpenseORM.purchase_date, ExpenseORM.id)
        .all()
    )

    filename = f"expenses_{month}.csv"

    return StreamingResponse(
        content=generate_csv(expenses),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
