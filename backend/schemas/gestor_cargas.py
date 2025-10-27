from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# -------------------
# 📦 Carga
# -------------------

class CargaBase(BaseModel):
    data_carregamento: date
    origem: str
    destino: str
    rota: str
    valor_frete: float
    status: Optional[str] = "normal"
    observacao_cliente: Optional[str] = None

class OcorrenciaCargaBase(BaseModel):
    motivo_id: int  # ← REMOVA carga_id daqui
    observacao: Optional[str]


class OcorrenciaCargaCreateSchema(OcorrenciaCargaBase):
    pass

class CargaCreateSchema(CargaBase):
    ocorrencias: Optional[List[OcorrenciaCargaCreateSchema]] = []    # ← Adicione esta linha


class CargaUpdateSchema(BaseModel):
    data_carregamento: Optional[date] = None
    origem: Optional[str] = None
    destino: Optional[str] = None
    rota: Optional[str] = None
    valor_frete: Optional[float] = None
    status: Optional[str] = None
    observacao_cliente: Optional[str] = None
    ocorrencias: Optional[List[OcorrenciaCargaCreateSchema]] = []   # ← Adicione esta linha

class TipoOcorrenciaSchemaSimples(BaseModel):
    id: int
    nome: str
    descricao: Optional[str]

    class Config:
        orm_mode = True


class MotivoOcorrenciaSchemaCompleto(BaseModel):
    id: int
    nome: str
    responsabilidade_cliente: Optional[bool]
    tipo: TipoOcorrenciaSchemaSimples

    class Config:
        orm_mode = True

class OcorrenciaCargaSchema(BaseModel):
    id: int
    carga_id: int
    motivo_id: int
    observacao: Optional[str]
    motivo: MotivoOcorrenciaSchemaCompleto

    class Config:
        orm_mode = True

class CargaSchema(CargaBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime
    ocorrencias: List[OcorrenciaCargaSchema] = []

    class Config:
        orm_mode = True

# -------------------
# 📑 TipoOcorrencia
# -------------------

class TipoOcorrenciaBase(BaseModel):
    nome: str
    descricao: Optional[str]

class TipoOcorrenciaCreateSchema(TipoOcorrenciaBase):
    pass

class TipoOcorrenciaUpdateSchema(BaseModel):
    nome: Optional[str]
    descricao: Optional[str]

class TipoOcorrenciaSchema(TipoOcorrenciaBase):
    id: int
    class Config:
        orm_mode = True


# -------------------
# ⚡ MotivoOcorrencia
# -------------------

class MotivoOcorrenciaBase(BaseModel):
    tipo_id: int
    nome: str
    responsabilidade_cliente: Optional[bool] = False

class MotivoOcorrenciaCreateSchema(MotivoOcorrenciaBase):
    pass

class MotivoOcorrenciaUpdateSchema(BaseModel):
    nome: Optional[str]
    responsabilidade_cliente: Optional[bool]

class MotivoOcorrenciaSchema(MotivoOcorrenciaBase):
    id: int
    class Config:
        orm_mode = True


# -------------------
# 🔗 OcorrenciaCarga
# -------------------




class OcorrenciaCargaUpdateSchema(BaseModel):
    motivo_id: Optional[int]
    observacao: Optional[str]










class CargaSchema(CargaBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime
    ocorrencias: List[OcorrenciaCargaSchema] = []

    class Config:
        orm_mode = True
