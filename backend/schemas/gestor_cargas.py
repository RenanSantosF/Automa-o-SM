from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# -------------------
# 📑 Tipo de Ocorrência
# -------------------

class TipoOcorrenciaBase(BaseModel):
    nome: str = Field(..., description="Nome do tipo de ocorrência (ex: Recusa, No show, Atraso)")
    descricao: Optional[str] = Field(None, description="Descrição detalhada do tipo de ocorrência")

class TipoOcorrenciaCreateSchema(TipoOcorrenciaBase):
    pass

class TipoOcorrenciaUpdateSchema(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None

class TipoOcorrenciaSchema(TipoOcorrenciaBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        orm_mode = True


# -------------------
# ⚡ Motivo de Ocorrência
# -------------------

class MotivoOcorrenciaBase(BaseModel):
    tipo_id: int
    nome: str
    responsabilidade_cliente: bool = False

class MotivoOcorrenciaCreateSchema(MotivoOcorrenciaBase):
    pass

class MotivoOcorrenciaUpdateSchema(BaseModel):
    tipo_id: Optional[int] = None
    nome: Optional[str] = None
    responsabilidade_cliente: Optional[bool] = None

class MotivoOcorrenciaSchema(MotivoOcorrenciaBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime
    tipo: Optional["TipoOcorrenciaSchema"] = None

    class Config:
        orm_mode = True


# -------------------
# 🔗 Ocorrência de Carga
# -------------------

class OcorrenciaCargaBase(BaseModel):
    motivo_id: int
    observacao: Optional[str] = None

class OcorrenciaCargaCreateSchema(OcorrenciaCargaBase):
    pass

class OcorrenciaCargaUpdateSchema(BaseModel):
    motivo_id: Optional[int] = None
    observacao: Optional[str] = None

class OcorrenciaCargaSchema(OcorrenciaCargaBase):
    id: int
    carga_id: int
    criado_em: datetime
    atualizado_em: datetime
    motivo: Optional[MotivoOcorrenciaSchema] = None

    class Config:
        orm_mode = True


# -------------------
# 📦 Carga
# -------------------

class CargaBase(BaseModel):
    data_carregamento: date
    uf_origem: str  # Ex: 'SP'
    cidade_origem: str  # Ex: 'São Paulo'
    uf_destino: str
    cidade_destino: str
    rota: str
    valor_frete: float
    status: Optional[str] = Field("normal", description="Status geral da carga")
    observacao_cliente: Optional[str] = None


class CargaCreateSchema(CargaBase):
    ocorrencias: Optional[List[OcorrenciaCargaCreateSchema]] = []


class CargaUpdateSchema(BaseModel):
    data_carregamento: Optional[date] = None
    uf_origem: Optional[str] = None
    cidade_origem: Optional[str] = None
    uf_destino: Optional[str] = None
    cidade_destino: Optional[str] = None
    rota: Optional[str] = None
    valor_frete: Optional[float] = None
    status: Optional[str] = None
    observacao_cliente: Optional[str] = None
    ocorrencias: Optional[List[OcorrenciaCargaUpdateSchema]] = []


class CargaSchema(CargaBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime
    ocorrencias: Optional[List[OcorrenciaCargaSchema]] = []

    # ---------- NOVOS CAMPOS DE RASTREABILIDADE ----------
    criado_por_id: Optional[int] = None
    criado_por_nome: Optional[str] = None
    criado_por_transportadora: Optional[str] = None
    criado_por_filial: Optional[str] = None
    criado_por_meta: Optional[dict] = None

    class Config:
        orm_mode = True


# Resolver referências circulares
MotivoOcorrenciaSchema.model_rebuild()
TipoOcorrenciaSchema.model_rebuild()
