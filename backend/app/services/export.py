"""
CSV export service for monthly expense reports.
"""

import csv
import io
from datetime import date
from typing import Generator, List

from app.orm_models import ExpenseORM


def generate_csv(expenses: List[ExpenseORM]) -> Generator[str, None, None]:
    """
    Stream CSV rows for a list of expense ORM objects.

    Yields one string chunk at a time so FastAPI's StreamingResponse
    can send data to the client incrementally without buffering the
    entire file in memory.

    CSV columns: id, date, merchant, category, total, tax
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow(["id", "date", "merchant", "category", "total", "tax"])
    yield output.getvalue()
    output.seek(0)
    output.truncate(0)

    # Data rows
    for expense in expenses:
        writer.writerow(
            [
                expense.id,
                expense.purchase_date.isoformat(),
                expense.merchant,
                expense.category,
                f"{expense.total:.2f}",
                f"{expense.tax:.2f}" if expense.tax is not None else "",
            ]
        )
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
