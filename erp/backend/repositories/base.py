"""Base repository helpers."""
from __future__ import annotations

from typing import Generic, Iterable, Optional, Type, TypeVar

from sqlalchemy.orm import Session

from erp.backend.models.base import Base


ModelType = TypeVar("ModelType", bound=Base)


class SQLAlchemyRepository(Generic[ModelType]):
    """Generic repository providing CRUD helpers."""

    def __init__(self, session: Session, model: Type[ModelType]):
        self.session = session
        self.model = model

    def get(self, obj_id: int) -> Optional[ModelType]:
        return self.session.get(self.model, obj_id)

    def list(self) -> Iterable[ModelType]:
        return self.session.query(self.model).all()

    def add(self, instance: ModelType) -> ModelType:
        self.session.add(instance)
        return instance

    def delete(self, instance: ModelType) -> None:
        self.session.delete(instance)
