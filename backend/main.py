import queue
import threading
import time
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
import threading
import traceback
from fastapi import HTTPException
from pydantic import BaseModel
from utils.login import login_apisul
from utils.prencher_sm import preencher_sm
from database import SessionLocal
from crud import criar_execucao, atualizar_status, buscar_execucao_por_id, deletar_execucao_por_id
from pydantic import BaseModel
from fastapi import Body
from typing import List, Optional
from crud import listar_execucoes
from fastapi.encoders import jsonable_encoder
from dotenv import load_dotenv
import os
from utils.email import enviar_email, montar_assunto_corpo

from models import Base
from database import engine

Base.metadata.create_all(bind=engine)

from fastapi import Query

fila_processamento = queue.Queue()

def worker():
    while True:
        item = fila_processamento.get()
        if item is None:
            break  # Permite encerrar a thread se necessário no futuro

        execucao_id, dados_principal, usuario, senha = item
        db = SessionLocal()
        try:
            processar_cte(execucao_id, dados_principal, db, usuario, senha)
        finally:
            db.close()
            fila_processamento.task_done()

# Inicia o worker em segundo plano ao subir a API
worker_thread = threading.Thread(target=worker, daemon=True)
worker_thread.start()


load_dotenv()

ENV = os.getenv("ENV", "local")
FRONTEND_URL = os.getenv("FRONTEND_URL")

app = FastAPI()

print(FRONTEND_URL)

origins = [
    FRONTEND_URL,  # seu frontend no Vercel
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # sem "*"
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



def processar_cte(execucao_id: int, dados_principal: dict, db: Session, usuario: str, senha: str):
    driver = None
    sm_numero = None
    try:
        print("entrou em processar CTe atualizando status")
        atualizar_status(db, execucao_id, status="Solicitação em andamento")
        print("entrou no login apisul")
        driver = login_apisul(usuario, senha)
        print("entrou em peenchimento de sm")
        preencher_sm(driver, dados_principal)
        print("saiu do preenchimento de sm")

        # Dados opcionais (depois de preencher_sm)
        remetente = dados_principal.get("remetente_cadastrado_apisul")
        destinatario = dados_principal.get("destinatario_cadastrado_apisul")
        rotas = dados_principal.get("rotas_cadastradas_apisul")
        rota_atual = dados_principal.get("rota_selecionada")
        sm_numero = dados_principal.get("numero_smp")
        print("entrou em atualiza status")
        atualizar_status(
            db,
            execucao_id,
            status="Sucesso",
            resultado=json.dumps(dados_principal),
            remetente_cadastrado_apisul=remetente,
            destinatario_cadastrado_apisul=destinatario,
            rotas_cadastradas_apisul=rotas,
            rota_selecionada = rota_atual,
            numero_smp = sm_numero

        )

        assunto, corpo = montar_assunto_corpo(dados_principal)
        enviar_email(
            destinatario="expedicao@dellmar.com.br",
            assunto=assunto,
            corpo=corpo
        )

        print("finalizou atualiza status")

    except Exception as e:
        # Mesmo em caso de erro, extrai os dados do dicionário (se existirem)
        print("caiu no erro e vai atualizar status")
        remetente = dados_principal.get("remetente_cadastrado_apisul")
        destinatario = dados_principal.get("destinatario_cadastrado_apisul")
        rotas = dados_principal.get("rotas_cadastradas_apisul")
        rota_atual = dados_principal.get("rota_selecionada")

        atualizar_status(
            db,
            execucao_id,
            status="Erro",
            resultado=json.dumps(dados_principal),
            erro=str(e),
            remetente_cadastrado_apisul=remetente,
            destinatario_cadastrado_apisul=destinatario,
            rotas_cadastradas_apisul=rotas,
            rota_selecionada = rota_atual,
            numero_smp = sm_numero
        )

        # Montar assunto e corpo para e-mail de erro
        assunto_erro = f"[ERRO] - Erro ao criar SMP para {dados_principal.get('condutor')} - {dados_principal.get('placa_cavalo')}"
        
        corpo_erro = f"""
        Encontramos um erro durante o processamento.

        Erro: {str(e)}

        Número SMP: {sm_numero or ''}

        Detalhes:
        - Condutor: {dados_principal.get("condutor")}
        - CPF do condutor: {dados_principal.get("cpf_condutor")}
        - Placa Cavalo: {dados_principal.get("placa_cavalo")}
        - Placa Carreta 1: {dados_principal.get("placa_carreta_1")}
        - Placa Carreta 2: {dados_principal.get("placa_carreta_2")}
        - Valor Total da Carga: {dados_principal.get("valor_total_carga")}

        - Local Origem: {dados_principal.get("local_origem")}
        - Remetente: {dados_principal.get("remetente_nome")} - CNPJ: {dados_principal.get("remetente_cnpj")}

        - Local Destino: {dados_principal.get("local_destino")}
        - Destinatário: {dados_principal.get("destinatario_nome")} - CNPJ: {dados_principal.get("destinatario_cnpj")}
        
        """.strip()

        enviar_email(
            destinatario="expedicao@dellmar.com.br",
            assunto=assunto_erro,
            corpo=corpo_erro
        )

    finally:
        if driver:
            driver.quit()

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

        dados_dict = payload.viagemData.dict()
        usuario = payload.login.usuario
        senha = payload.login.senha

        execucao = criar_execucao(db, dados_dict)

        # thread = threading.Thread(target=processar_cte, args=(execucao.id, dados_dict, db, usuario, senha))
        # thread.start()
        # Em vez de iniciar thread direto, coloca na fila
        fila_processamento.put((execucao.id, dados_dict, usuario, senha))

        return {
            "mensagem": "Solicitação recebida e sendo processada em segundo plano.",
            "id_execucao": execucao.id,
            "dados": dados_dict
        }

    except Exception as e:
        return {"erro": f"Ocorreu um erro ao processar os dados: {str(e)}"}

@app.get("/execucoes/")
def get_execucoes(
    limite: int = Query(20, ge=1),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    execucoes = listar_execucoes(db=db, limite=limite, offset=offset)
    return jsonable_encoder(execucoes)



class ExecucaoId(BaseModel):
    id: int
class PayloadReprocessar(BaseModel):
    execucao_id: ExecucaoId
    login: LoginData

@app.post("/reprocessar-execucao/")
async def reprocessar_execucao(payload: PayloadReprocessar, db: Session = Depends(get_db)):
    try:
        print("iniciou reprocessamento")

        id = payload.execucao_id.id  # <- agora é necessário acessar o campo `.id`
        usuario = payload.login.usuario
        senha = payload.login.senha
        execucao = buscar_execucao_por_id(db, id)

        if not execucao:
            raise HTTPException(status_code=404, detail="Execução não encontrada")

        if execucao.status != "Erro":
            raise HTTPException(status_code=400, detail="Execução não falhou, não é necessário reprocessar")

        # Atualiza o status antes de iniciar o reprocessamento
        execucao.status = "Solicitação em andamento"
        db.commit()
        db.refresh(execucao)

        try:
            dados_principal = json.loads(execucao.resultado)
        except Exception as e:
            print("Erro ao carregar JSON do resultado:", execucao.resultado)
            raise HTTPException(status_code=500, detail="Resultado da execução não é um JSON válido")

        print("Levou à thread")

        # thread = threading.Thread(target=processar_cte, args=(execucao.id, dados_principal, db, usuario, senha))
        # thread.start()

        # Em vez de iniciar thread, coloca na fila
        fila_processamento.put((execucao.id, dados_principal, usuario, senha))


        print("passou pela thread")

        return {
            "mensagem": "Solicitação de reprocessamento recebida e sendo processada em segundo plano.",
            "id_execucao": execucao.id
        }

    except Exception as e:
        
        execucao.status = "Erro"
        db.commit()
        db.refresh(execucao)
        print("Erro no reprocessamento:")
        traceback.print_exc()  # <--- isso aqui mostra o erro no terminal!

        raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao tentar reprocessar: {str(e)}")
    


@app.delete("/execucao/{execucao_id}")
def deletar_execucao(execucao_id: int, db: Session = Depends(get_db)):
    sucesso = deletar_execucao_por_id(db, execucao_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Execução não encontrada.")
    return {"mensagem": f"Execução com ID {execucao_id} deletada com sucesso."}