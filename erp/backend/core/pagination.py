"""Pagination utilities."""
from __future__ import annotations

from math import ceil
from typing import Generic, Iterable, Sequence, TypeVar

from pydantic import BaseModel


T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Represents a paginated response."""

    items: Sequence[T]
    total: int
    page: int
    page_size: int
    pages: int


def paginate(query, page: int, page_size: int) -> tuple[Iterable[T], int]:
    """Apply offset/limit pagination to SQLAlchemy query."""

    page = max(page, 1)
    page_size = max(page_size, 1)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def build_page(items: Sequence[T], total: int, page: int, page_size: int) -> Page[T]:
    """Build a Page model from sequence data."""

    pages = ceil(total / page_size) if page_size else 1
    return Page(items=items, total=total, page=page, page_size=page_size, pages=pages)
