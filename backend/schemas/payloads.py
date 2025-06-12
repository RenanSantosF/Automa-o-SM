from pydantic import BaseModel
from typing import Optional, List

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
    notas: List[NFeCreate]
