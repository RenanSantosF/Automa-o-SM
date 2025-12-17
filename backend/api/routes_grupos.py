from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models_gerais.permissoes import Permissao
from core.dependencies import get_db
from models import User
from models_gerais.permissoes import Grupo
from schemas.grupos import (
    GrupoSchema,
    GrupoCreateSchema,
    GrupoUpdateSchema
)

from schemas.payloads import UserSchema
from utils.get_current_user import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin / Grupos"])


@router.post("/grupos", response_model=GrupoSchema)
async def criar_grupo(
    payload: GrupoCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    grupo = Grupo(nome=payload.nome, descricao=payload.descricao)

    if payload.permissoes:
        permissoes = (
            db.query(Permissao)
            .filter(Permissao.codigo.in_(payload.permissoes))
            .all()
        )
        grupo.permissoes = permissoes

    db.add(grupo)
    db.commit()
    db.refresh(grupo)
    return grupo


# Listar grupos
@router.get("/grupos", response_model=List[GrupoSchema])
async def listar_grupos(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.query(Grupo).all()


@router.put("/grupos/{grupo_id}", response_model=GrupoSchema)
async def editar_grupo(
    grupo_id: int,
    payload: GrupoUpdateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    if payload.nome is not None:
        grupo.nome = payload.nome

    if payload.descricao is not None:
        grupo.descricao = payload.descricao

    if payload.permissoes is not None:
        grupo.permissoes = (
            db.query(Permissao)
            .filter(Permissao.codigo.in_(payload.permissoes))
            .all()
        )

    db.commit()
    db.refresh(grupo)
    return grupo


# Deletar grupo (somente se não houver usuários vinculados)
@router.delete("/grupos/{grupo_id}")
async def deletar_grupo(
    grupo_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    usuarios_vinculados = db.query(User).filter(User.grupo_id == grupo_id).count()
    if usuarios_vinculados > 0:
        raise HTTPException(
            status_code=400,
            detail="Não é possível deletar o grupo pois existem usuários vinculados."
        )

    db.delete(grupo)
    db.commit()
    return {"detail": f"Grupo '{grupo.nome}' deletado com sucesso"}

from typing import Optional

@router.put("/usuarios/{usuario_id}/grupo", response_model=UserSchema)
async def vincular_usuario_grupo(
    usuario_id: int,
    grupo_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    usuario = db.query(User).filter(User.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # 👉 remover grupo
    if grupo_id is None:
        usuario.grupo_id = None
        db.commit()
        db.refresh(usuario)
        return usuario

    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    usuario.grupo_id = grupo.id
    db.commit()
    db.refresh(usuario)
    return usuario
