from fastapi import APIRouter, UploadFile, File, status, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from core.dependencies import get_db
from models_gerais.knowledge import Knowledge
from schemas.knowledge import KnowledgeCreate, KnowledgeOut
from utils.get_current_user import get_current_user
from uuid import uuid4
import os

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

UPLOAD_DIR = "uploads/knowledge"


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {"url": f"/static/knowledge/{filename}"}

@router.post("/", response_model=KnowledgeOut)
def create_knowledge(
    item: KnowledgeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    existing = db.query(Knowledge).filter(Knowledge.title == item.title).first()
    if existing:
        raise HTTPException(status_code=400, detail="Título já existe.")
    entry = Knowledge(**item.dict(), author_id=current_user.id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.get("/", response_model=List[KnowledgeOut])
def list_knowledge(
    q: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Knowledge)
    if q:
        query = query.filter(
            (Knowledge.title.ilike(f"%{q}%")) |
            (Knowledge.content.ilike(f"%{q}%"))
        )

    return (
        query
        .order_by(Knowledge.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


# @router.get("/", response_model=List[KnowledgeOut])
# def list_knowledge(
#     q: str | None = Query(None),
#     db: Session = Depends(get_db)
# ):
#     query = db.query(Knowledge)
#     if q:
#         query = query.filter(
#             (Knowledge.title.ilike(f"%{q}%")) |
#             (Knowledge.content.ilike(f"%{q}%"))
#         )
#     return query.order_by(Knowledge.created_at.desc()).all()


@router.get("/{item_id}", response_model=KnowledgeOut)
def get_knowledge(item_id: int, db: Session = Depends(get_db)):
    entry = db.query(Knowledge).filter(Knowledge.id == item_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    return entry


@router.put("/{item_id}", response_model=KnowledgeOut)
def update_knowledge(
    item_id: int,
    item: KnowledgeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    entry = db.query(Knowledge).filter(Knowledge.id == item_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    
    # Se quiser restringir só ao autor ou admin
    if current_user.setor != "admin" and entry.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão para editar.")

    entry.title = item.title
    entry.content = item.content
    entry.type = item.type
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledge(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    entry = db.query(Knowledge).filter(Knowledge.id == item_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Item não encontrado.")

    # Se quiser restringir só ao autor ou admin
    if current_user.setor != "admin" and entry.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir.")

    db.delete(entry)
    db.commit()
    return
