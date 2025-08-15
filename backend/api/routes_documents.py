from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Body,
    Form,
    WebSocket,
    WebSocketDisconnect,
    status,
    Query
)

from schemas.payloads import DocumentCommentSchema
from sqlalchemy import func, or_
from database import SessionLocal
from sqlalchemy.orm import Session, selectinload
from datetime import datetime, timezone, timedelta
from models import User, Document, DocumentFile, DocumentComment
from core.dependencies import get_db
from utils.salvar_comprovantes import salvar_comprovante
from utils.get_current_user import get_current_user
from utils.get_caminho_arquivo import get_caminho_arquivo_por_id
from schemas.payloads import DocumentSchema, ComentarioSchema
from typing import List,  Optional
from jose import JWTError, jwt
from fastapi.responses import FileResponse
import os
import mimetypes
import asyncio
from fastapi.encoders import jsonable_encoder
import json
from sqlalchemy.orm import selectinload


SECRET_KEY = os.getenv("SECRET_KEY", "sua_chave_secreta_aqui")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(
    prefix="/documentos",
    tags=["Documentos"],
)

# ----- 🔗 WebSocket Connection Manager -----
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass  # Erro silencioso na conexão

manager = ConnectionManager()

def get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            return None
        user = db.query(User).filter(User.username == username).first()
        return user
    except JWTError:
        return None

async def notificar_atualizacao():
    await manager.broadcast('{"tipo":"documentos_atualizados"}')






async def notificar_documento_atualizado(doc_id: int):
    with SessionLocal() as db:
        doc = db.query(Document).options(
            selectinload(Document.usuario),
            selectinload(Document.arquivos).selectinload(DocumentFile.usuario),
            selectinload(Document.comentarios_rel).selectinload(DocumentComment.usuario),
        ).filter(Document.id == doc_id).first()
        if not doc:
            return

        payload = {
            "tipo": "documento_atualizado",
            "documento": jsonable_encoder(doc)
        }
        await manager.broadcast(json.dumps(payload))


async def notificar_documento_deletado(doc_id: int):
    payload = {"tipo": "documento_deletado", "id": doc_id}
    await manager.broadcast(json.dumps(payload))


async def notificar_novo_documento(doc: Document):
    payload = {
        "tipo": "documento_atualizado",  # pode reaproveitar o mesmo tipo que atualizarDocumento usa
        "documento": {
            "id": doc.id,
            "usuario_id": doc.usuario_id,
            "nome": doc.nome,
            "placa": doc.placa,
            "cliente": doc.cliente,
            "data_do_malote": str(doc.data_do_malote),
            "status": doc.status,
            "criado_em": doc.criado_em.isoformat(),
            "atualizado_em": doc.atualizado_em.isoformat() if doc.atualizado_em else None,
            "arquivos": [
                {
                    "id": doc.arquivos[0].id,
                    "nome_arquivo": doc.arquivos[0].nome_arquivo,
                    "criado_em": doc.arquivos[0].criado_em.isoformat(),
                    "usuario_id": doc.arquivos[0].usuario_id,
                    "visualizado_por": [],
                }
            ],
            "comentarios_rel": [],
        },
    }
    # aqui envia via WebSocket para todos os clientes conectados
    await manager.broadcast(json.dumps(payload))




@router.websocket("/ws/documentos")
async def websocket_documentos(websocket: WebSocket):
    token = websocket.query_params.get("token")
    print("Tentando conectar WebSocket...")

    if not token:
        print("❌ Sem token, conexão recusada.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise JWTError()
    except JWTError:
        print("❌ Token inválido.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    with SessionLocal() as db:
        user = db.query(User).filter(User.username == username).first()
    if not user:
        print(f"❌ Usuário '{username}' não encontrado no banco.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    print(f"✅ WebSocket conectado com sucesso: {username}")
    await manager.connect(websocket)

    try:
        while True:
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        print(f"🔌 WebSocket desconectado: {username}")
    finally:
        manager.disconnect(websocket)

@router.post("/upload")
async def upload_documento(
    file: UploadFile = File(...),
    nome: str = Form(...),
    placa: str = Form(...),
    cliente: str = Form(...),                  # NOVO
    data_do_malote: str = Form(...),           # NOVO (virá como ISO date "YYYY‑MM‑DD")
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    caminho = salvar_comprovante(file)

    try:
        data_malote = datetime.fromisoformat(data_do_malote).date()
    except ValueError:
        raise HTTPException(400, "data_do_malote inválida (use YYYY-MM-DD)")

    doc = Document(
        usuario_id=usuario.id,
        nome=nome,
        placa=placa,
        cliente=cliente,
        data_do_malote=data_malote,
        status="enviado",
        criado_em=datetime.now(timezone.utc),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    versao = DocumentFile(
        document_id=doc.id,
        nome_arquivo=file.filename,
        caminho_arquivo=caminho,
        criado_em=datetime.now(timezone.utc),
        usuario_id=usuario.id,
    )
    db.add(versao)
    db.commit()

    asyncio.create_task(notificar_novo_documento(doc))


    return {"id_documento": doc.id, "status": doc.status}


# ----- 🔍 Listagens -----
@router.get("/pendentes", response_model=List[DocumentSchema])
async def listar_pendentes(
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor != "ocorrencia":
        raise HTTPException(403, "Não autorizado")

    documentos = db.query(Document).filter(
        Document.status.in_(["enviado", "reprovado"])
    ).all()

    return documentos


@router.get("/aprovados", response_model=List[DocumentSchema])
async def listar_aprovados(
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor != "expedicao":
        raise HTTPException(403, "Não autorizado")

    documentos = db.query(Document).filter(Document.status == "aprovado").all()

    return documentos

@router.get("/todos", response_model=List[DocumentSchema])
async def listar_todos_documentos(
    usuario: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    cte: Optional[str] = Query(None),
    nome: Optional[str] = Query(None),
    data_inicial: Optional[str] = Query(None),
    data_final: Optional[str] = Query(None),
    cliente: Optional[str] = Query(None),
    data_malote_inicial: Optional[str] = Query(None),
    data_malote_final: Optional[str] = Query(None),
    manifesto_baixado: Optional[str] = Query(None),  # Alterei para snake_case aqui

    skip: int = 0,
    limit: int = Query(500, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    
    query = db.query(Document).options(
        selectinload(Document.usuario),
        selectinload(Document.arquivos).selectinload(DocumentFile.usuario),
        selectinload(Document.comentarios_rel).selectinload(DocumentComment.usuario),
    )

    print("Filtro manifesto_baixado recebido:", manifesto_baixado)

    if usuario:
        usuario_lower = usuario.lower()
        query = query.join(Document.usuario).filter(
            or_(
                func.lower(User.username).like(f"%{usuario_lower}%"),
            )
        )

    if status:
        query = query.filter(Document.status == status)

    if cte:
        cte_like = f"%{cte.lower()}%"
        query = query.filter(func.lower(Document.placa).like(cte_like))

    if nome:
        nome_like = f"%{nome.lower()}%"
        query = query.filter(func.lower(Document.nome).like(nome_like))

    if data_inicial:
        try:
            dt_inicio = datetime.fromisoformat(data_inicial)
            query = query.filter(Document.criado_em >= dt_inicio)
        except Exception:
            pass

    if data_final:
        try:
            dt_fim = datetime.fromisoformat(data_final) + timedelta(days=1)
            query = query.filter(Document.criado_em < dt_fim)
        except Exception:
            pass

    if cliente:
        cli_like = f"%{cliente.lower()}%"
        query = query.filter(func.lower(Document.cliente).like(cli_like))

    if data_malote_inicial:
        try:
            dm_inicio = datetime.fromisoformat(data_malote_inicial).date()
            query = query.filter(Document.data_do_malote >= dm_inicio)
        except Exception:
            pass

    if data_malote_final:
        try:
            dm_fim = datetime.fromisoformat(data_malote_final).date()
            query = query.filter(Document.data_do_malote <= dm_fim)
        except Exception:
            pass

    if manifesto_baixado is not None and manifesto_baixado != "":
        manifesto_lower = manifesto_baixado.lower()
        if manifesto_lower == "true":
            manifesto_bool = True
        elif manifesto_lower == "false":
            manifesto_bool = False
        else:
            manifesto_bool = None

        if manifesto_bool is not None:
            query = query.filter(Document.manifesto_baixado == manifesto_bool)
            print(f"Aplicando filtro manifesto_baixado == {manifesto_bool}")

    query = query.order_by(Document.atualizado_em.desc())
    query = query.offset(skip).limit(limit)

    documentos = query.all()
    return documentos





MAX_MESSAGES = 50  # limite máximo por carregamento

@router.get("/documentos/{doc_id}/mensagens", response_model=List[DocumentCommentSchema])
async def listar_mensagens(
    doc_id: int,
    skip: int = 0,
    limit: int = Query(20, ge=1, le=MAX_MESSAGES),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Conta o total de mensagens para este documento
    total_mensagens = db.query(func.count(DocumentComment.id))\
                       .filter(DocumentComment.documento_id == doc_id)\
                       .scalar()

    # Consulta as mensagens mais recentes primeiro (mas vamos inverter depois)
    query = db.query(DocumentComment)\
              .filter(DocumentComment.documento_id == doc_id)\
              .order_by(DocumentComment.criado_em.desc())\
              .offset(skip)\
              .limit(limit)\
              .options(selectinload(DocumentComment.usuario))
    
    mensagens = query.all()
    
    # Inverte a ordem para exibir do mais antigo para o mais recente
    return {
        "mensagens": list(reversed(mensagens)),
        "total": total_mensagens,
        "tem_mais": (skip + limit) < total_mensagens
    }


@router.post("/{document_id}/marcar-visualizados")
async def marcar_comentarios_visualizados(
    document_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documento = db.query(Document).filter(Document.id == document_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    # Marcar comentários como visualizados
    comentarios = db.query(DocumentComment).filter(DocumentComment.document_id == document_id).all()
    for comentario in comentarios:
        visualizado = comentario.visualizado_por or []
        if user.id not in visualizado:
            visualizado = visualizado.copy()
            visualizado.append(user.id)
            comentario.visualizado_por = visualizado

    # Marcar arquivos como visualizados
    arquivos = db.query(DocumentFile).filter(DocumentFile.document_id == document_id).all()
    for arquivo in arquivos:
        visualizado = arquivo.visualizado_por or []
        if user.id not in visualizado:
            visualizado = visualizado.copy()
            visualizado.append(user.id)
            arquivo.visualizado_por = visualizado

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar visualização: {str(e)}")

    return {"ok": True}


# ----- ✔️ Ações -----
@router.post("/{doc_id}/aprovar")
async def aprovar_documento(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor not in ["ocorrencia", "admin"]:
        raise HTTPException(403, "Não autorizado")


    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    doc.status = "aprovado"
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    # asyncio.create_task(notificar_atualizacao())
    asyncio.create_task(notificar_documento_atualizado(doc.id))


    return {"msg": "Documento aprovado"}


@router.post("/{doc_id}/reprovar")
async def reprovar_documento(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    
    if usuario.setor not in ["ocorrencia", "admin"]:
        raise HTTPException(403, "Não autorizado")

    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    doc.status = "reprovado"
    doc.atualizado_em = datetime.now(timezone.utc)
    print(doc)
    db.commit()

    asyncio.create_task(notificar_documento_atualizado(doc.id))


    return {"msg": "Documento reprovado"}


@router.post("/{doc_id}/comentario")
async def adicionar_comentario(
    doc_id: int,
    payload: ComentarioSchema,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    novo_coment = DocumentComment(
        document_id=doc.id,
        usuario_id=usuario.id,
        texto=payload.texto,
        criado_em=datetime.now(timezone.utc),
    )
    db.add(novo_coment)
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    asyncio.create_task(notificar_documento_atualizado(doc.id))

    return {"msg": "Comentário adicionado com sucesso", "comentario_id": novo_coment.id}


@router.post("/{doc_id}/upload-versao")
async def upload_nova_versao(
    doc_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")


    caminho = salvar_comprovante(file)

    nova_versao = DocumentFile(
        document_id=doc.id,
        nome_arquivo=file.filename,
        caminho_arquivo=caminho,
        criado_em=datetime.now(timezone.utc),
        usuario_id=usuario.id,
    )
    db.add(nova_versao)
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    asyncio.create_task(notificar_documento_atualizado(doc.id))


    return {"msg": "Nova versão enviada", "id_versao": nova_versao.id}

@router.post("/{doc_id}/solicitar-aprovacao")
async def solicitar_aprovacao(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    # Permite se for o dono do documento ou se for admin
    if usuario.id != doc.usuario_id and usuario.setor != "admin":
        raise HTTPException(403, "Não autorizado")

    if doc.status != "reprovado":
        raise HTTPException(400, "Aprovação só pode ser solicitada se estiver reprovado")

    doc.status = "enviado"
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    asyncio.create_task(notificar_documento_atualizado(doc.id))


    return {"msg": "Solicitação de aprovação enviada"}


@router.post("/{doc_id}/saldo-liberado")
async def liberar_saldo(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor not in ["expedicao", "admin"]:
        raise HTTPException(status_code=403, detail="Não autorizado")


    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    doc.status = "saldo_liberado"
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    asyncio.create_task(notificar_documento_atualizado(doc.id))


    return {"msg": "Saldo liberado para o documento"}


@router.post("/{doc_id}/baixar")
async def baixar_documento(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor != "expedicao":
        raise HTTPException(403, "Não autorizado")

    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    doc.status = "baixado"
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    asyncio.create_task(notificar_documento_atualizado(doc.id))


    return {"msg": "Documento marcado como baixado"}


@router.post("/{doc_id}/manifesto-baixado")
async def marcar_manifesto_baixado(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    # Apenas usuários do setor 'expedicao' podem marcar como baixado
    if usuario.setor not in ["expedicao", "admin"]:
        raise HTTPException(status_code=403, detail="Não autorizado")

    documento = db.query(Document).filter(Document.id == doc_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    # Atualiza o campo booleano
    documento.manifesto_baixado = True
    documento.atualizado_em = datetime.now(timezone.utc)

    db.commit()

    asyncio.create_task(notificar_documento_atualizado(documento))

    return {"msg": "Manifesto marcado como baixado com sucesso"}


# ----- 📄 Visualizar Arquivo -----
@router.get("/{arquivo_id}/visualizar")
async def visualizar_arquivo(
    arquivo_id: int,
    db: Session = Depends(get_db),
):
    caminho = get_caminho_arquivo_por_id(db, arquivo_id)

    if not caminho or not os.path.isfile(caminho):
        raise HTTPException(404, "Arquivo não encontrado")

    mime_type, _ = mimetypes.guess_type(caminho)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(caminho, media_type=mime_type)




@router.delete("/{doc_id}", status_code=204)
async def deletar_documento(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    # Deletar arquivos físicos associados
    arquivos = db.query(DocumentFile).filter(DocumentFile.document_id == doc.id).all()
    for arquivo in arquivos:
        caminho = arquivo.caminho_arquivo
        if caminho and os.path.isfile(caminho):
            try:
                os.remove(caminho)
            except Exception as e:
                # Pode logar erro aqui, mas não bloqueia a exclusão
                print(f"Erro ao deletar arquivo {caminho}: {e}")

    # Apagar registros de arquivos e comentários associados
    db.query(DocumentFile).filter(DocumentFile.document_id == doc.id).delete(synchronize_session=False)
    db.query(DocumentComment).filter(DocumentComment.document_id == doc.id).delete(synchronize_session=False)

    # Apagar documento
    db.delete(doc)
    db.commit()

    print("Delete: documento deletado, enviando notificação websocket...")
    asyncio.create_task(notificar_documento_deletado(doc.id))
    print("Delete: notificação disparada")


    return None  # 204 No Content
