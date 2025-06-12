# api/routes_execucoes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from typing import Optional
import json
import traceback
from core.dependencies import get_db


from crud import listar_execucoes, buscar_execucao_por_id, deletar_execucao_por_id
from utils.login import login_apisul
from workers.fila_worker import fila_processamento  # fila global da worker

router = APIRouter()

class ExecucaoId(BaseModel):
    id: int

class LoginData(BaseModel):
    usuario: str
    senha: str

class PayloadReprocessar(BaseModel):
    execucao_id: ExecucaoId
    login: LoginData


@router.get("/execucoes/")
def get_execucoes(
    limite: int = Query(20, ge=1),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    execucoes = listar_execucoes(db=db, limite=limite, offset=offset)
    return jsonable_encoder(execucoes)


@router.post("/reprocessar-execucao/")
async def reprocessar_execucao(payload: PayloadReprocessar, db: Session = Depends(get_db)):
    try:
        id = payload.execucao_id.id
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
        except Exception:
            raise HTTPException(status_code=500, detail="Resultado da execução não é um JSON válido")

        # Coloca na fila para processamento assíncrono
        fila_processamento.put((execucao.id, dados_principal, usuario, senha))

        return {
            "mensagem": "Solicitação de reprocessamento recebida e sendo processada em segundo plano.",
            "id_execucao": execucao.id
        }

    except Exception as e:
        execucao.status = "Erro"
        db.commit()
        db.refresh(execucao)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao tentar reprocessar: {str(e)}")


@router.delete("/execucao/{execucao_id}")
def deletar_execucao(execucao_id: int, db: Session = Depends(get_db)):
    sucesso = deletar_execucao_por_id(db, execucao_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Execução não encontrada.")
    return {"mensagem": f"Execução com ID {execucao_id} deletada com sucesso."}
