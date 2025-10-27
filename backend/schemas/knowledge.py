from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class KnowledgeType(str, Enum):
    tutorial = "tutorial"
    solution = "solution"

class KnowledgeBase(BaseModel):
    title: str
    content: str
    type: KnowledgeType

class KnowledgeCreate(KnowledgeBase):
    pass

class KnowledgeOut(KnowledgeBase):
    id: int
    author_id: int
    created_at: datetime

    class Config:
        orm_mode = True
