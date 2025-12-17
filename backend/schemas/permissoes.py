from pydantic import BaseModel

class PermissaoSchema(BaseModel):
    id: int
    codigo: str

    class Config:
        from_attributes = True
