

# # api/routes_execucoes.py
# from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session
# from fastapi.encoders import jsonable_encoder
# from pydantic import BaseModel
# import json
# import traceback
# from core.dependencies import get_db

# from crud import listar_execucoes, buscar_execucao_por_id, deletar_execucao_por_id
# from workers.fila_worker import fila_processamento

# from api.websocket.ws_manager import ws_manager

# router = APIRouter()

# # MODELOS
# class ExecucaoId(BaseModel):
#     id: int

# class LoginData(BaseModel):
#     usuario: str
#     senha: str

# class PayloadReprocessar(BaseModel):
#     execucao_id: ExecucaoId
#     login: LoginData


# # ---------------------------------------------------------------------
# # GET EXECUÇÕES (SEM BROADCAST!)
# # ---------------------------------------------------------------------
# @router.get("/execucoes/")
# async def get_execucoes(
#     limite: int = Query(20, ge=1),
#     offset: int = Query(0, ge=0),
#     db: Session = Depends(get_db)
# ):
#     execucoes = listar_execucoes(db=db, limite=limite, offset=offset)
#     return jsonable_encoder(execucoes)


# # ---------------------------------------------------------------------
# # REPROCESSAR EXECUÇÃO
# # ---------------------------------------------------------------------
# @router.post("/reprocessar-execucao/")
# async def reprocessar_execucao(payload: PayloadReprocessar, db: Session = Depends(get_db)):
#     try:
#         id_exec = payload.execucao_id.id
#         usuario = payload.login.usuario
#         senha = payload.login.senha
#         execucao = buscar_execucao_por_id(db, id_exec)

#         if not execucao:
#             await sm_manager.broadcast(json.dumps({
#                 "tipo": "erro",
#                 "mensagem": f"Execução {id_exec} não encontrada."
#             })
#             raise HTTPException(status_code=404, detail="Execução não encontrada")

#         if execucao.status != "Erro":
#             await sm_manager.broadcast(json.dumps({
#                 "tipo": "erro",
#                 "mensagem": f"Execução {id_exec} não está em erro — reprocessamento não permitido."
#             })
#             raise HTTPException(status_code=400, detail="Execução não falhou")

#         # Atualiza status
#         execucao.status = "Solicitação em andamento"
#         db.commit()

#         # Dados
#         try:
#             dados_principal = json.loads(execucao.resultado)
#         except:
#             await sm_manager.broadcast(json.dumps({
#                 "tipo": "erro",
#                 "mensagem": f"Execução {id_exec}: resultado JSON inválido."
#             })
#             raise HTTPException(status_code=500, detail="JSON inválido")

#         # Envia para fila
#         fila_processamento.put((execucao.id, dados_principal, usuario, senha))

#         # Notifica início do reprocessamento
#         await sm_manager.broadcast(json.dumps({
#             "tipo": "reprocessamento",
#             "mensagem": f"Execução {id_exec} enviada para reprocessamento."
#         })

#         return {"mensagem": "OK", "id_execucao": id_exec}

#     except Exception as e:
#         execucao.status = "Erro"
#         db.commit()

#         await sm_manager.broadcast(json.dumps({
#             "tipo": "erro",
#             "mensagem": f"Erro ao reprocessar {id_exec}: {str(e)}"
#         })

#         raise HTTPException(status_code=500, detail=str(e))


# # ---------------------------------------------------------------------
# # DELETE EXECUÇÃO
# # ---------------------------------------------------------------------
# @router.delete("/execucao/{execucao_id}")
# async def deletar_execucao(execucao_id: int, db: Session = Depends(get_db)):

#     sucesso = deletar_execucao_por_id(db, execucao_id)

#     if not sucesso:
#         await sm_manager.broadcast(json.dumps({
#             "tipo": "erro",
#             "mensagem": f"Execução {execucao_id} não encontrada."
#         })
#         raise HTTPException(status_code=404, detail="Execução não encontrada.")

#     await sm_manager.broadcast(json.dumps({
#         "tipo": "sucesso",
#         "mensagem": f"Execução {execucao_id} deletada com sucesso."
#     })

#     return {"mensagem": "Removida"}


# api/routes_execucoes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
import json
from core.dependencies import get_db

from crud import listar_execucoes, buscar_execucao_por_id, deletar_execucao_por_id
from workers.fila_worker import fila_processamento

# 🟢 Importação correta — usa o MESMO manager do WebSocket que já funciona (documentos)
from api.websocket.manager import manager

router = APIRouter()

# MODELOS
class ExecucaoId(BaseModel):
    id: int

class LoginData(BaseModel):
    usuario: str
    senha: str

class PayloadReprocessar(BaseModel):
    execucao_id: ExecucaoId
    login: LoginData


# ---------------------------------------------------------------------
# GET EXECUÇÕES
# ---------------------------------------------------------------------
@router.get("/execucoes/")
async def get_execucoes(
    limite: int = Query(20, ge=1),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    execucoes = listar_execucoes(db=db, limite=limite, offset=offset)
    return jsonable_encoder(execucoes)


# ---------------------------------------------------------------------
# REPROCESSAR EXECUÇÃO
# ---------------------------------------------------------------------
@router.post("/reprocessar-execucao/")
async def reprocessar_execucao(payload: PayloadReprocessar, db: Session = Depends(get_db)):
    try:
        id_exec = payload.execucao_id.id
        usuario = payload.login.usuario
        senha = payload.login.senha

        execucao = buscar_execucao_por_id(db, id_exec)
        if not execucao:
            await manager.broadcast(json.dumps({
                "tipo": "erro",
                "mensagem": f"Execução {id_exec} não encontrada."
            }))
            raise HTTPException(status_code=404, detail="Execução não encontrada")

        if execucao.status != "Erro":
            await manager.broadcast(json.dumps({
                "tipo": "erro",
                "mensagem": f"Execução {id_exec} não está em erro — reprocessamento não permitido."
            }))
            raise HTTPException(status_code=400, detail="Execução não falhou")

        # Atualiza status
        execucao.status = "Solicitação em andamento"
        db.commit()

        # Carrega resultado JSON salvo
        try:
            dados_principal = json.loads(execucao.resultado)
        except:
            await manager.broadcast(json.dumps({
                "tipo": "erro",
                "mensagem": f"Execução {id_exec}: resultado JSON inválido."
            }))
            raise HTTPException(status_code=500, detail="JSON inválido")

        # Envia para fila worker
        fila_processamento.put((execucao.id, dados_principal, usuario, senha))

        # Notifica início
        await manager.broadcast(json.dumps({
            "tipo": "reprocessamento",
            "mensagem": f"Execução {id_exec} enviada para reprocessamento."
        }))

        return {"mensagem": "OK", "id_execucao": id_exec}

    except Exception as e:
        execucao.status = "Erro"
        db.commit()

        await manager.broadcast(json.dumps({
            "tipo": "erro",
            "mensagem": f"Erro ao reprocessar {id_exec}: {str(e)}"
        }))

        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------
# DELETE EXECUÇÃO
# ---------------------------------------------------------------------
@router.delete("/execucao/{execucao_id}")
async def deletar_execucao(execucao_id: int, db: Session = Depends(get_db)):
    sucesso = deletar_execucao_por_id(db, execucao_id)

    if not sucesso:
        await manager.broadcast(json.dumps({
            "tipo": "erro",
            "mensagem": f"Execução {execucao_id} não encontrada."
        }))
        raise HTTPException(status_code=404, detail="Execução não encontrada.")

    await manager.broadcast(json.dumps({
        "tipo": "sucesso",
        "mensagem": f"Execução {execucao_id} deletada com sucesso."
    }))

    return {"mensagem": "Removida"}
