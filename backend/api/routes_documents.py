from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Body,
    Form,
)
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from models import User, Document, DocumentFile, DocumentComment
from core.dependencies import get_db
from utils.salvar_comprovantes import salvar_comprovante
from utils.get_current_user import get_current_user
from utils.get_caminho_arquivo import get_caminho_arquivo_por_id
from schemas.payloads import DocumentSchema, ComentarioSchema
from typing import List
from fastapi.responses import FileResponse
from fastapi import Form
import os 
from sqlalchemy.orm import selectinload

router = APIRouter(
    prefix="/documentos",
    tags=["Documentos"],
)


@router.post("/upload")
async def upload_documento(
    file: UploadFile = File(...),
    nome: str = Form(...),
    placa: str = Form(...),
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    caminho = salvar_comprovante(file)

    doc = Document(
        usuario_id=usuario.id,
        nome=nome,
        placa=placa,
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
        usuario_id=usuario.id,  # <-- Aqui, salva quem enviou o arquivo
    )
    db.add(versao)
    db.commit()

    return {"id_documento": doc.id, "status": doc.status}



@router.get("/pendentes", response_model=List[DocumentSchema])
def listar_pendentes(
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor != "ocorrencia":
        raise HTTPException(403, "Não autorizado")
    documentos = db.query(Document).filter(Document.status.in_(["enviado", "reprovado"])).all()
    return documentos


@router.post("/{doc_id}/aprovar")
def aprovar_documento(
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
    db.commit()
    return {"msg": "Documento aprovado"}


@router.post("/{doc_id}/reprovar")
def reprovar_documento(
    doc_id: int,
    comentario: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor != "ocorrencia":
        raise HTTPException(403, "Não autorizado")
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    doc.status = "reprovado"
    db.commit()
    return {"msg": "Documento reprovado"}


@router.post("/{doc_id}/comentario")
def adicionar_comentario(
    doc_id: int,
    payload: ComentarioSchema,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")

    novo_coment = DocumentComment(
        document_id=doc_id,
        usuario_id=usuario.id,
        texto=payload.texto,
        criado_em=datetime.now(timezone.utc),
    )
    db.add(novo_coment)
    db.commit()
    db.refresh(novo_coment)

    return {"msg": "Comentário adicionado com sucesso", "comentario_id": novo_coment.id}

@router.post("/{doc_id}/upload-versao")
def upload_nova_versao(
    doc_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    if usuario.id != doc.usuario_id:
        raise HTTPException(403, "Não autorizado")

    caminho = salvar_comprovante(file)
    nova_versao = DocumentFile(
        document_id=doc_id,
        nome_arquivo=file.filename,
        caminho_arquivo=caminho,
        criado_em=datetime.now(timezone.utc),
        usuario_id=usuario.id,
    )
    db.add(nova_versao)

    # REMOVA ou comente esta linha:
    # doc.status = "enviado"

    db.commit()
    db.refresh(nova_versao)

    return {"msg": "Nova versão enviada", "id_versao": nova_versao.id}


@router.post("/{doc_id}/solicitar-aprovacao")
def solicitar_aprovacao(
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
    db.commit()

    return {"msg": "Solicitação de aprovação enviada"}



@router.get("/aprovados", response_model=List[DocumentSchema])
def listar_aprovados(
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if usuario.setor != "expedicao":
        raise HTTPException(403, "Não autorizado")
    documentos = db.query(Document).filter(Document.status == "aprovado").all()
    return documentos



import mimetypes
from fastapi.responses import FileResponse

@router.get("/{arquivo_id}/visualizar")
def visualizar_arquivo(arquivo_id: int, db: Session = Depends(get_db)):
    caminho = get_caminho_arquivo_por_id(db, arquivo_id)
    if not caminho or not os.path.isfile(caminho):
        raise HTTPException(404, "Arquivo não encontrado")

    mime_type, _ = mimetypes.guess_type(caminho)
    if not mime_type:
        mime_type = "application/octet-stream"  # fallback genérico

    return FileResponse(caminho, media_type=mime_type)





@router.post("/{doc_id}/baixar")
def baixar_documento(
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
    db.commit()
    return {"msg": "Documento marcado como baixado"}





# @router.get("/todos", response_model=List[DocumentSchema])
# def listar_todos_documentos(
#     db: Session = Depends(get_db),
#     usuario: User = Depends(get_current_user),
# ):
#     documentos = (
#         db.query(Document)
#         .options(
#             selectinload(Document.usuario),
#             selectinload(Document.arquivos),
#             selectinload(Document.comentarios_rel).selectinload(DocumentComment.usuario)
#         )
#         .all()
#     )
#     return documentos

@router.get("/todos", response_model=List[DocumentSchema])
def listar_todos_documentos(
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    documentos = (
        db.query(Document)
        .options(
            selectinload(Document.usuario),
            selectinload(Document.arquivos).selectinload(DocumentFile.usuario),  # <-- aqui
            selectinload(Document.comentarios_rel).selectinload(DocumentComment.usuario)
        )
        .all()
    )
    return documentos



@router.post("/{doc_id}/saldo-liberado")
def liberar_saldo(
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
    db.commit()
    return {"msg": "Saldo liberado para o documento"}