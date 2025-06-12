from fastapi import APIRouter, Depends, Body
from schemas.payloads import PayloadUpload
from core.dependencies import get_db
from crud import criar_execucao
from workers.fila_worker import fila_processamento
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/upload-xml/")
async def upload_xml(payload: PayloadUpload = Body(...), db: Session = Depends(get_db)):
    try:
        dados_dict = payload.viagemData.dict()
        usuario = payload.login.usuario
        senha = payload.login.senha
        execucao = criar_execucao(db, dados_dict)
        fila_processamento.put((execucao.id, dados_dict, usuario, senha))

        return {
            "mensagem": "Solicitação recebida e sendo processada em segundo plano.",
            "id_execucao": execucao.id
        }
    except Exception as e:
        return {"erro": f"Ocorreu um erro ao processar os dados: {str(e)}"}
