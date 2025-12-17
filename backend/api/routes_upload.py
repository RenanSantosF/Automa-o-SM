from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from schemas.payloads import PayloadUpload
from core.dependencies import get_db
from utils.get_current_user import get_current_user
from utils.permissoes import require_permissao
from crud import criar_execucao
from workers.fila_worker import fila_processamento
from models import User


router = APIRouter()

@router.post(
    "/upload-xml/",
    dependencies=[Depends(require_permissao("execucoes.criar"))]
)
async def upload_xml(
    payload: PayloadUpload = Body(...),
    db: Session = Depends(get_db),
    usuario_logado: User = Depends(get_current_user),
):
    try:
        dados_dict = payload.viagemData.dict()

        # credenciais Apisul (do payload, não do token)
        usuario_apisul = payload.login.usuario
        senha_apisul = payload.login.senha

        execucao = criar_execucao(db, dados_dict)

        fila_processamento.put(
            (execucao.id, dados_dict, usuario_apisul, senha_apisul)
        )

        return {
            "mensagem": "Solicitação recebida e sendo processada em segundo plano.",
            "id_execucao": execucao.id
        }

    except Exception as e:
        return {
            "erro": f"Ocorreu um erro ao processar os dados: {str(e)}"
        }
