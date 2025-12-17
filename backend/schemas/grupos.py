from pydantic import BaseModel
from typing import Optional, List
from schemas.permissoes import PermissaoSchema

class GrupoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

class GrupoCreateSchema(GrupoBase):
    permissoes: List[str] = []   # códigos

class GrupoUpdateSchema(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    permissoes: Optional[List[str]] = None

class GrupoSchema(GrupoBase):
    id: int
    permissoes: List[PermissaoSchema] = []

    class Config:
        from_attributes = True
