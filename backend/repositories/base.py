"""
Base repository with common CRUD operations
"""
from typing import Generic, TypeVar, Type, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from backend.models.database import Base


ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with generic CRUD operations"""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get(self, id: Any) -> Optional[ModelType]:
        """Get by ID"""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ModelType]:
        """Get multiple with pagination"""
        query = self.db.query(self.model)
        
        if filters:
            query = query.filter_by(**filters)
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, obj_in: Dict[str, Any]) -> ModelType:
        """Create new record"""
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def update(self, db_obj: ModelType, obj_in: Dict[str, Any]) -> ModelType:
        """Update existing record"""
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: Any) -> bool:
        """Delete by ID"""
        obj = self.get(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records"""
        query = self.db.query(self.model)
        if filters:
            query = query.filter_by(**filters)
        return query.count()

