from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
import threading

from utils.login import login_apisul
from utils.prencher_sm import preencher_sm
from utils.extract_cte import extrair_dados_do_cte_xml
from database import SessionLocal
from crud import criar_execucao, atualizar_status, buscar_execucao_por_id

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def processar_cte(execucao_id: int, dados_principal: dict, db: Session,  usuario: str, senha: str,):

    try:
        driver = login_apisul(usuario, senha)
        preencher_sm(driver, dados_principal)

        atualizar_status(db, execucao_id, status="Sucesso", resultado=json.dumps(dados_principal))
    except Exception as e:
        atualizar_status(
                db,
                execucao_id,
                status="Erro",
                resultado=json.dumps(dados_principal),
                erro=str(e)
            )

from pydantic import BaseModel
from fastapi import Body
from typing import List, Optional

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


@app.post("/upload-xml/")
async def upload_xml(payload: PayloadUpload = Body(...), db: Session = Depends(get_db)):
    try:
        print("dados")
        dados_dict = payload.viagemData.dict()
        usuario = payload.login.usuario
        senha = payload.login.senha

        execucao = criar_execucao(db, dados_dict)


        thread = threading.Thread(target=processar_cte, args=(execucao.id, dados_dict, db, usuario, senha))
        thread.start()

        return {
            "mensagem": "Solicitação recebida e sendo processada em segundo plano.",
            "id_execucao": execucao.id,
            "dados": dados_dict
        }

    except Exception as e:
        return {"erro": f"Ocorreu um erro ao processar os dados: {str(e)}"}

from crud import listar_execucoes
from fastapi.encoders import jsonable_encoder

@app.get("/execucoes/")
def get_execucoes(db: Session = Depends(get_db)):
    execucoes = listar_execucoes(db)
    return jsonable_encoder(execucoes)


import traceback
from fastapi import HTTPException
from pydantic import BaseModel
class ExecucaoId(BaseModel):
    id: int
class PayloadReprocessar(BaseModel):
    execucao_id: ExecucaoId
    login: LoginData

@app.post("/reprocessar-execucao/")
async def reprocessar_execucao(payload: PayloadReprocessar, db: Session = Depends(get_db)):
    try:
        print("Payload recebido:", payload)
        print("Execucao ID:", payload.execucao_id.id)
        print("Login:", payload.login.usuario, payload.login.senha)

        id = payload.execucao_id.id  # <- agora é necessário acessar o campo `.id`
        usuario = payload.login.usuario
        senha = payload.login.senha
        execucao = buscar_execucao_por_id(db, id)

        if not execucao:
            raise HTTPException(status_code=404, detail="Execução não encontrada")

        if execucao.status != "Erro":
            raise HTTPException(status_code=400, detail="Execução não falhou, não é necessário reprocessar")

        try:
            dados_principal = json.loads(execucao.resultado)
        except Exception as e:
            print("Erro ao carregar JSON do resultado:", execucao.resultado)
            raise HTTPException(status_code=500, detail="Resultado da execução não é um JSON válido")


        thread = threading.Thread(target=processar_cte, args=(execucao.id, dados_principal, db, usuario, senha))
        thread.start()

        return {
            "mensagem": "Solicitação de reprocessamento recebida e sendo processada em segundo plano.",
            "id_execucao": execucao.id
        }

    except Exception as e:
        print("Erro no reprocessamento:")
        traceback.print_exc()  # <--- isso aqui mostra o erro no terminal!

        raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao tentar reprocessar: {str(e)}")
