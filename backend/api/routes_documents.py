



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

    asyncio.create_task(notificar_atualizacao())

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

    skip: int = 0,
    limit: int = Query(500, ge=1, le=500),  # Começa com 50 por padrão, pode pedir mais no frontend
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),

):
    
    query = db.query(Document).options(
        selectinload(Document.usuario),
        selectinload(Document.arquivos).selectinload(DocumentFile.usuario),
        selectinload(Document.comentarios_rel).selectinload(DocumentComment.usuario),
    )

    print(f"🔎 Limit recebido: {limit}")


    # Filtro por usuário (nome ou username)
    if usuario:
        usuario_lower = usuario.lower()
        query = query.join(Document.usuario).filter(
            or_(
                func.lower(User.username).like(f"%{usuario_lower}%"),
                
            )
        )

    # Filtro status exato
    if status:
        query = query.filter(Document.status == status)

    # Filtro por CTE (usando LIKE para aproximação)
    if cte:
        cte_like = f"%{cte.lower()}%"
        query = query.filter(func.lower(Document.placa).like(cte_like))

    # Filtro por nome do documento (aproximação)
    if nome:
        nome_like = f"%{nome.lower()}%"
        query = query.filter(func.lower(Document.nome).like(nome_like))

    # Filtro por data
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


    # Filtro por cliente (aproximação)
    if cliente:
        cli_like = f"%{cliente.lower()}%"
        query = query.filter(func.lower(Document.cliente).like(cli_like))

    # Filtro por data_do_malote
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


    # Ordenar do mais recente para o mais antigo
    query = query.order_by(Document.atualizado_em.desc())


    # Paginação
    query = query.offset(skip).limit(limit)

    documentos = query.all()
    return documentos


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
    if usuario.setor != "ocorrencia":
        raise HTTPException(403, "Não autorizado")

    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    doc.status = "aprovado"
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    asyncio.create_task(notificar_atualizacao())

    return {"msg": "Documento aprovado"}


@router.post("/{doc_id}/reprovar")
async def reprovar_documento(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor != "ocorrencia":
        raise HTTPException(403, "Não autorizado")

    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    doc.status = "reprovado"
    doc.atualizado_em = datetime.now(timezone.utc)
    print(doc)
    db.commit()

    asyncio.create_task(notificar_atualizacao())

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

    asyncio.create_task(notificar_atualizacao())

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

    asyncio.create_task(notificar_atualizacao())

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

    if usuario.id != doc.usuario_id:
        raise HTTPException(403, "Não autorizado")

    if doc.status != "reprovado":
        raise HTTPException(400, "Aprovação só pode ser solicitada se estiver reprovado")

    doc.status = "enviado"
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    asyncio.create_task(notificar_atualizacao())

    return {"msg": "Solicitação de aprovação enviada"}


@router.post("/{doc_id}/saldo-liberado")
async def liberar_saldo(
    doc_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor != "expedicao":
        raise HTTPException(403, "Não autorizado")

    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    doc.status = "saldo_liberado"
    doc.atualizado_em = datetime.now(timezone.utc)
    db.commit()

    asyncio.create_task(notificar_atualizacao())

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

    asyncio.create_task(notificar_atualizacao())

    return {"msg": "Documento marcado como baixado"}


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
    asyncio.create_task(notificar_atualizacao())
    print("Delete: notificação disparada")


    return None  # 204 No Content
