"""
SQLAlchemy ORM models (database tables).
Kept separate from Pydantic schemas to respect the layered architecture.
"""

from datetime import date
from typing import List

from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ExpenseORM(Base):
    """Represents a single expense record in the database."""

    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    merchant = Column(String(255), nullable=False, index=True)
    purchase_date = Column(Date, nullable=False, index=True)
    total = Column(Float, nullable=False)
    tax = Column(Float, nullable=True)
    category = Column(String(100), nullable=False, index=True)

    # One expense → many line items
    line_items = relationship(
        "LineItemORM",
        back_populates="expense",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class LineItemORM(Base):
    """Represents a single line item within an expense."""

    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expense_id = Column(
        Integer,
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)

    expense = relationship("ExpenseORM", back_populates="line_items")
