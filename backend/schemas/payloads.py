from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from pydantic import EmailStr

class LoginData(BaseModel):
    usuario: str
    senha: str

class DadosCTe(BaseModel):
    condutor: str
    cpf_condutor: str
    valor_total_carga: str
    placa_cavalo: str
    placa_carreta_1: Optional[str] = None
    placa_carreta_2: Optional[str] = None
    local_origem: str
    local_destino: str
    remetente_nome: str
    remetente_cnpj: str
    remetente_endereco: str
    destinatario_nome: str
    destinatario_cnpj: str
    destinatario_endereco: str
    remetente_cadastrado_apisul: Optional[str] = None
    destinatario_cadastrado_apisul: Optional[str] = None
    rotas_cadastradas_apisul: Optional[List[str]] = None

class PayloadUpload(BaseModel):
    viagemData: DadosCTe
    login: LoginData

class ExecucaoId(BaseModel):
    id: int

class PayloadReprocessar(BaseModel):
    execucao_id: ExecucaoId
    login: LoginData



class NFeCreate(BaseModel):
    chave: str

class CTeCreate(BaseModel):
    nome: str
    xml: str
    solicitacao_id: str  # 🔥 Adicionado aqui
    notas: List[NFeCreate]

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    senha: str
    setor: str
    usuario_apisul: Optional[str] = None
    senha_apisul: Optional[str] = None

    
class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr]   # opcional aqui
    setor: str
    usuario_apisul: Optional[str] = None

    class Config:
        orm_mode = True



# Schema para atualização (senha opcional)
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    setor: Optional[str] = None
    usuario_apisul: Optional[str] = None
    senha_apisul: Optional[str] = None





class UserSchema(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr]
    setor: str

    class Config:
        orm_mode = True

class DocumentFileSchema(BaseModel):
    id: int
    nome_arquivo: str
    caminho_arquivo: str
    criado_em: datetime
    usuario: Optional[UserSchema]  # já incluído

    class Config:
        orm_mode = True


class DocumentCommentSchema(BaseModel):
    id: int
    usuario_id: int
    texto: str
    criado_em: datetime
    visualizado_por: Optional[List[int]] = []
    usuario: Optional[UserSchema]  # <-- Adiciona isso

    class Config:
        orm_mode = True


class DocumentSchema(BaseModel):
    id: int
    usuario_id: int
    nome: str
    placa: str
    cliente: str                         # ← NOVO
    data_do_malote: date                 
    criado_em: datetime
    atualizado_em: Optional[datetime] = None  #
    status: str
    usuario: UserSchema  # <-- Adicione isso
    arquivos: List[DocumentFileSchema] = []
    comentarios_rel: List[DocumentCommentSchema] = []

    class Config:
        orm_mode = True


class DocumentCreateSchema(BaseModel):
    nome: str
    placa: str
    cliente: str                         # ← NOVO
    data_do_malote: date

class ComentarioSchema(BaseModel):
    texto: str