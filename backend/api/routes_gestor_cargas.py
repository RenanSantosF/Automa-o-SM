from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from datetime import date
from sqlalchemy import func

from database import SessionLocal
from core.dependencies import get_db
from utils.get_current_user import get_current_user
from models import User, Carga, TipoOcorrencia, MotivoOcorrencia, OcorrenciaCarga
from schemas.gestor_cargas import (
    CargaSchema, CargaCreateSchema, CargaUpdateSchema,
    TipoOcorrenciaSchema, TipoOcorrenciaCreateSchema, TipoOcorrenciaUpdateSchema,
    MotivoOcorrenciaSchema, MotivoOcorrenciaCreateSchema, MotivoOcorrenciaUpdateSchema,
    OcorrenciaCargaSchema, OcorrenciaCargaCreateSchema, OcorrenciaCargaUpdateSchema,
)

router = APIRouter(
    prefix="/gestor-cargas",
    tags=["Gestor de Cargas"],
)

# Função utilitária para normalizar campos string e incluir meta do criador
def normalize_carga(carga: Carga) -> dict:
    return {
        "id": carga.id,
        "data_carregamento": carga.data_carregamento,
        "uf_origem": carga.uf_origem or "",
        "cidade_origem": carga.cidade_origem or "",
        "uf_destino": carga.uf_destino or "",
        "cidade_destino": carga.cidade_destino or "",
        "rota": carga.rota or "",
        "valor_frete": float(carga.valor_frete) if carga.valor_frete is not None else None,
        "status": carga.status,
        "observacao_cliente": carga.observacao_cliente,
        "criado_em": carga.criado_em,
        "atualizado_em": carga.atualizado_em,
        # ocorrencias serializadas
        "ocorrencias": [
            {
                "id": oc.id,
                "carga_id": oc.carga_id,  # <-- obrigatorio no schema
                "motivo_id": oc.motivo_id,
                "observacao": oc.observacao or "",
                "criado_em": oc.criado_em,
                "atualizado_em": oc.atualizado_em,
                "motivo": {
                    "id": oc.motivo.id,
                    "nome": oc.motivo.nome,
                    "criado_em": getattr(oc.motivo, "criado_em", None),
                    "atualizado_em": getattr(oc.motivo, "atualizado_em", None),
                    "tipo_id": getattr(oc.motivo, "tipo_id", None),
                    "tipo": {
                        "id": oc.motivo.tipo.id,
                        "nome": oc.motivo.tipo.nome,
                        "criado_em": getattr(oc.motivo.tipo, "criado_em", None),
                        "atualizado_em": getattr(oc.motivo.tipo, "atualizado_em", None),
                    } if getattr(oc.motivo, "tipo", None) else None
                } if getattr(oc, "motivo", None) else None
            }
            for oc in carga.ocorrencias or []
        ],

        # ---------- campos de rastreabilidade ----------
        "criado_por_id": getattr(carga, "criado_por_id", None),
        "criado_por_nome": getattr(carga, "criado_por_nome", None),
        "criado_por_transportadora": getattr(carga, "criado_por_transportadora", None),
        "criado_por_filial": getattr(carga, "criado_por_filial", None),
        "criado_por_meta": getattr(carga, "criado_por_meta", None),
    }


# =====================================================
# 📦 CRUD Cargas
# =====================================================

@router.post("/cargas", response_model=CargaSchema)
async def criar_carga(
    payload: CargaCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Cria uma nova carga e registra automaticamente os dados do criador (usuário logado).
    Permite também criar ocorrências associadas no mesmo payload.
    """
    try:
        ocorrencias_data = payload.ocorrencias or []
        carga_data = payload.dict(exclude={"ocorrencias"})

        # Cria objeto principal
        carga = Carga(**carga_data)

        # Preenche rastreabilidade automática
        carga.criado_por_id = user.id
        carga.criado_por_nome = getattr(user, "nome", None) or getattr(user, "username", None)
        carga.criado_por_transportadora = getattr(user, "transportadora", None)
        carga.criado_por_filial = getattr(user, "filial", None)

        # Snapshot completo do criador (para auditoria)
        carga.criado_por_meta = {
            "id": user.id,
            "nome": getattr(user, "nome", None),
            "email": getattr(user, "email", None),
            "setor": getattr(user, "setor", None),
            "transportadora": getattr(user, "transportadora", None),
            "filial": getattr(user, "filial", None),
        }

        db.add(carga)
        db.flush()  # garante ID da carga antes de criar ocorrências

        # Cria as ocorrências associadas (se houver)
        for oc_data in ocorrencias_data:
            ocorrencia = OcorrenciaCarga(
                **oc_data.dict(),
                carga_id=carga.id
            )
            db.add(ocorrencia)

        db.commit()
        db.refresh(carga)

        # Retorna carga completa com ocorrências aninhadas
        carga_completa = (
            db.query(Carga)
            .options(
                joinedload(Carga.ocorrencias)
                .joinedload(OcorrenciaCarga.motivo)
                .joinedload(MotivoOcorrencia.tipo)
            )
            .filter(Carga.id == carga.id)
            .first()
        )

        return normalize_carga(carga_completa)

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(500, f"Erro no banco de dados: {str(e)}")

    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Erro ao criar carga: {str(e)}")


@router.get("/cargas", response_model=List[CargaSchema])
async def listar_cargas(
    skip: int = 0,
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = None,
    uf_origem: Optional[str] = None,
    cidade_origem: Optional[str] = None,
    uf_destino: Optional[str] = None,
    cidade_destino: Optional[str] = None,
    rota: Optional[str] = None,
    valor_min: Optional[float] = None,
    valor_max: Optional[float] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    # --- filtros novos por criador / transportadora / filial
    criado_por_id: Optional[int] = Query(None, description="Filtra por ID do usuário que criou a carga"),
    criado_por_transportadora: Optional[str] = Query(None, description="Filtra por transportadora do criador"),
    criado_por_filial: Optional[str] = Query(None, description="Filtra por filial do criador"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Carga).options(
        joinedload(Carga.ocorrencias)
        .joinedload(OcorrenciaCarga.motivo)
        .joinedload(MotivoOcorrencia.tipo)
    )

    if status:
        query = query.filter(Carga.status == status)
    if uf_origem:
        query = query.filter(Carga.uf_origem == uf_origem)
    if cidade_origem:
        query = query.filter(Carga.cidade_origem.ilike(f"%{cidade_origem}%"))
    if uf_destino:
        query = query.filter(Carga.uf_destino == uf_destino)
    if cidade_destino:
        query = query.filter(Carga.cidade_destino.ilike(f"%{cidade_destino}%"))
    if rota:
        query = query.filter(Carga.rota.ilike(f"%{rota}%"))
    if valor_min is not None:
        query = query.filter(Carga.valor_frete >= valor_min)
    if valor_max is not None:
        query = query.filter(Carga.valor_frete <= valor_max)
    if data_inicio:
        query = query.filter(Carga.data_carregamento >= data_inicio)
    if data_fim:
        query = query.filter(Carga.data_carregamento <= data_fim)

    # filtros novos
    if criado_por_id is not None:
        query = query.filter(Carga.criado_por_id == criado_por_id)
    if criado_por_transportadora:
        # case-insensitive match (substrings)
        query = query.filter(Carga.criado_por_transportadora.ilike(f"%{criado_por_transportadora}%"))
    if criado_por_filial:
        query = query.filter(Carga.criado_por_filial.ilike(f"%{criado_por_filial}%"))

    cargas = query.order_by(Carga.criado_em.desc()).offset(skip).limit(limit).all()
    return [normalize_carga(c) for c in cargas]


@router.get("/cargas/{carga_id}", response_model=CargaSchema)
async def obter_carga(carga_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    carga = (
        db.query(Carga)
        .options(joinedload(Carga.ocorrencias).joinedload(OcorrenciaCarga.motivo).joinedload(MotivoOcorrencia.tipo))
        .filter(Carga.id == carga_id)
        .first()
    )
    if not carga:
        raise HTTPException(404, "Carga não encontrada")
    return normalize_carga(carga)


@router.put("/cargas/{carga_id}", response_model=CargaSchema)
async def atualizar_carga(
    carga_id: int,
    payload: CargaUpdateSchema = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        # carregar carga com ocorrências originais
        carga = (
            db.query(Carga)
            .options(joinedload(Carga.ocorrencias).joinedload(OcorrenciaCarga.motivo))
            .filter(Carga.id == carga_id)
            .first()
        )
        if not carga:
            raise HTTPException(404, "Carga não encontrada")

        ocorrencias_data = payload.ocorrencias or []

        # aplicar campos da carga (exceto ocorrências)
        carga_data = {k: v for k, v in payload.dict(exclude={'ocorrencias'}).items() if v is not None}
        for field, value in carga_data.items():
            setattr(carga, field, value)

        # signature helper
        def make_signature(motivo_id, observacao):
            return f"{int(motivo_id)}|{(observacao or '').strip().lower()}"

        # existing ocorrências indexed by id and signature
        db.flush()
        existing_ocorrencias = {oc.id: oc for oc in carga.ocorrencias if oc.id}
        signature_index = {make_signature(oc.motivo_id, oc.observacao): oc for oc in carga.ocorrencias if oc.id}

        kept_ids = set()

        for oc_data in ocorrencias_data:
            oc_id = getattr(oc_data, "id", None)
            motivo_id = getattr(oc_data, "motivo_id", None)
            observacao = getattr(oc_data, "observacao", "") or ""

            oc_id_int = None
            if oc_id is not None:
                try:
                    oc_id_int = int(oc_id)
                except Exception:
                    oc_id_int = None

            if oc_id_int and oc_id_int in existing_ocorrencias:
                ocorr = existing_ocorrencias[oc_id_int]
                ocorr.motivo_id = motivo_id
                ocorr.observacao = observacao
                kept_ids.add(oc_id_int)
                signature_index[make_signature(motivo_id, observacao)] = ocorr
            else:
                sig = make_signature(motivo_id, observacao)
                matched = signature_index.get(sig)
                if matched:
                    matched.motivo_id = motivo_id
                    matched.observacao = observacao
                    if matched.id:
                        kept_ids.add(matched.id)
                else:
                    nova = OcorrenciaCarga(
                        motivo_id=motivo_id,
                        observacao=observacao,
                        carga_id=carga_id
                    )
                    db.add(nova)

        db.flush()

        # reconstruir signatures do estado atual
        db.refresh(carga)
        current_signatures = {make_signature(oc.motivo_id, oc.observacao): oc.id for oc in carga.ocorrencias if oc.id}
        for oc_data in ocorrencias_data:
            sig = make_signature(getattr(oc_data, "motivo_id", None), getattr(oc_data, "observacao", "") or "")
            if sig in current_signatures:
                kept_ids.add(current_signatures[sig])

        # ids originais (antes de deletar) - carregados direto da tabela
        orig_query_ids = {r[0] for r in db.query(OcorrenciaCarga.id).filter(OcorrenciaCarga.carga_id == carga_id).all()}

        to_remove = list(orig_query_ids - kept_ids)
        if to_remove:
            db.query(OcorrenciaCarga).filter(
                OcorrenciaCarga.carga_id == carga_id,
                OcorrenciaCarga.id.in_(to_remove)
            ).delete(synchronize_session=False)

        db.commit()

        carga_completa = (
            db.query(Carga)
            .options(joinedload(Carga.ocorrencias).joinedload(OcorrenciaCarga.motivo).joinedload(MotivoOcorrencia.tipo))
            .filter(Carga.id == carga_id)
            .first()
        )
        return carga_completa

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(500, f"Erro no banco de dados: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Erro ao atualizar carga: {str(e)}")


@router.delete("/cargas/{carga_id}")
async def deletar_carga(
    carga_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    carga = db.query(Carga).filter(Carga.id == carga_id).first()
    if not carga:
        raise HTTPException(404, "Carga não encontrada")
    db.delete(carga)
    db.commit()
    return {"ok": True}

# =====================================================
# 📑 Tipos, Motivos e Ocorrências
# =====================================================

@router.post("/tipos", response_model=TipoOcorrenciaSchema)
async def criar_tipo(payload: TipoOcorrenciaCreateSchema, db: Session = Depends(get_db)):
    tipo = TipoOcorrencia(**payload.dict())
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo


@router.get("/tipos", response_model=List[TipoOcorrenciaSchema])
async def listar_tipos(db: Session = Depends(get_db)):
    return db.query(TipoOcorrencia).options(selectinload(TipoOcorrencia.motivos)).all()


@router.put("/tipos/{tipo_id}", response_model=TipoOcorrenciaSchema)
async def atualizar_tipo(tipo_id: int, payload: TipoOcorrenciaUpdateSchema, db: Session = Depends(get_db)):
    tipo = db.query(TipoOcorrencia).filter(TipoOcorrencia.id == tipo_id).first()
    if not tipo:
        raise HTTPException(404, "Tipo não encontrado")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(tipo, field, value)
    db.commit()
    db.refresh(tipo)
    return tipo


@router.delete("/tipos/{tipo_id}")
async def deletar_tipo(tipo_id: int, db: Session = Depends(get_db)):
    tipo = db.query(TipoOcorrencia).get(tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo não encontrado")

    motivos_vinculados = db.query(MotivoOcorrencia).filter_by(tipo_id=tipo_id).count()
    if motivos_vinculados > 0:
        raise HTTPException(
            400,
            f"Não é possível deletar o tipo '{tipo.nome}' pois há {motivos_vinculados} motivo(s) vinculados a ele."
        )

    db.delete(tipo)
    db.commit()
    return {"detail": "Tipo deletado com sucesso"}



# -------------------
# ⚡ Motivos
# -------------------

@router.post("/motivos", response_model=MotivoOcorrenciaSchema)
async def criar_motivo(payload: MotivoOcorrenciaCreateSchema, db: Session = Depends(get_db)):
    motivo = MotivoOcorrencia(**payload.dict())
    db.add(motivo)
    db.commit()
    db.refresh(motivo)
    return motivo


@router.get("/motivos", response_model=List[MotivoOcorrenciaSchema])
async def listar_motivos(db: Session = Depends(get_db)):
    return db.query(MotivoOcorrencia).options(selectinload(MotivoOcorrencia.tipo)).all()


@router.put("/motivos/{motivo_id}", response_model=MotivoOcorrenciaSchema)
async def atualizar_motivo(motivo_id: int, payload: MotivoOcorrenciaUpdateSchema, db: Session = Depends(get_db)):
    motivo = db.query(MotivoOcorrencia).filter(MotivoOcorrencia.id == motivo_id).first()
    if not motivo:
        raise HTTPException(404, "Motivo não encontrado")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(motivo, field, value)
    db.commit()
    db.refresh(motivo)
    return motivo


@router.delete("/motivos/{motivo_id}")
async def deletar_motivo(motivo_id: int, db: Session = Depends(get_db)):
    motivo = db.query(MotivoOcorrencia).filter(MotivoOcorrencia.id == motivo_id).first()
    if not motivo:
        raise HTTPException(404, "Motivo não encontrado")

    # ✅ Verifica se está sendo usado em alguma ocorrência
    ocorrencias_vinculadas = db.query(OcorrenciaCarga).filter(OcorrenciaCarga.motivo_id == motivo_id).count()
    if ocorrencias_vinculadas > 0:
        raise HTTPException(
            400,
            f"Não é possível deletar o motivo '{motivo.nome}' pois está vinculado a {ocorrencias_vinculadas} ocorrência(s)."
        )

    db.delete(motivo)
    db.commit()
    return {"detail": f"Motivo '{motivo.nome}' deletado com sucesso."}

# -------------------
# 🔗 Ocorrências
# -------------------

@router.post("/ocorrencias", response_model=OcorrenciaCargaSchema)
async def criar_ocorrencia(payload: OcorrenciaCargaCreateSchema, db: Session = Depends(get_db)):
    ocorrencia = OcorrenciaCarga(**payload.dict())
    db.add(ocorrencia)
    db.commit()
    db.refresh(ocorrencia)
    return ocorrencia


@router.get("/ocorrencias", response_model=List[OcorrenciaCargaSchema])
async def listar_ocorrencias(
    carga_id: Optional[int] = None,
    tipo_id: Optional[int] = None,
    motivo_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    skip: int = 0,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(OcorrenciaCarga).options(
        selectinload(OcorrenciaCarga.carga),
        selectinload(OcorrenciaCarga.motivo)
    )

    if carga_id:
        query = query.filter(OcorrenciaCarga.carga_id == carga_id)
    if motivo_id:
        query = query.filter(OcorrenciaCarga.motivo_id == motivo_id)
    if tipo_id:
        query = query.join(OcorrenciaCarga.motivo).filter(MotivoOcorrencia.tipo_id == tipo_id)
    if data_inicio:
        query = query.filter(OcorrenciaCarga.criado_em >= data_inicio)
    if data_fim:
        query = query.filter(OcorrenciaCarga.criado_em <= data_fim)

    return query.offset(skip).limit(limit).all()


@router.put("/ocorrencias/{ocorrencia_id}", response_model=OcorrenciaCargaSchema)
async def atualizar_ocorrencia(ocorrencia_id: int, payload: OcorrenciaCargaUpdateSchema, db: Session = Depends(get_db)):
    ocorrencia = db.query(OcorrenciaCarga).filter(OcorrenciaCarga.id == ocorrencia_id).first()
    if not ocorrencia:
        raise HTTPException(404, "Ocorrência não encontrada")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(ocorrencia, field, value)
    db.commit()
    db.refresh(ocorrencia)
    return ocorrencia


@router.delete("/ocorrencias/{ocorrencia_id}")
async def deletar_ocorrencia(ocorrencia_id: int, db: Session = Depends(get_db)):
    ocorrencia = db.query(OcorrenciaCarga).filter(OcorrenciaCarga.id == ocorrencia_id).first()
    if not ocorrencia:
        raise HTTPException(404, "Ocorrência não encontrada")
    db.delete(ocorrencia)
    db.commit()
    return {"ok": True}



@router.get("/filters")
async def listar_filtros(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        creators = (
            db.query(User.id, User.nome, User.username)
            .join(Carga, Carga.criado_por_id == User.id)
            .distinct()
            .order_by(User.nome)
            .all()
        )

        transportadoras = [
            r[0] for r in db.query(Carga.criado_por_transportadora)
            .filter(Carga.criado_por_transportadora.isnot(None))
            .distinct()
            .order_by(Carga.criado_por_transportadora)
            .all()
            if r[0]
        ]

        filiais = [
            r[0] for r in db.query(Carga.criado_por_filial)
            .filter(Carga.criado_por_filial.isnot(None))
            .distinct()
            .order_by(Carga.criado_por_filial)
            .all()
            if r[0]
        ]

        return {
            "creators": [{"id": c.id, "nome": c.nome or c.username or f"#{c.id}"} for c in creators],
            "transportadoras": transportadoras,
            "filiais": filiais,
        }

    except Exception as e:
        raise HTTPException(500, f"Erro ao carregar filtros: {str(e)}")


# =====================================================
# 📊 Estatísticas
# =====================================================

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict, Any
from datetime import date
from sqlalchemy import func, desc, and_, or_, literal_column







@router.get("/estatisticas")
async def estatisticas(
    uf_origem: Optional[str] = None,
    cidade_origem: Optional[str] = None,
    uf_destino: Optional[str] = None,
    cidade_destino: Optional[str] = None,
    rota: Optional[str] = None,
    tipo_ocorrencia_id: Optional[int] = None,
    motivo_ocorrencia_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    criado_por_id: Optional[int] = None,
    criado_por_transportadora: Optional[str] = None,
    criado_por_filial: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        # --- Base query ---
        query_base = db.query(Carga)

        if uf_origem:
            query_base = query_base.filter(Carga.uf_origem == uf_origem)
        if cidade_origem:
            query_base = query_base.filter(Carga.cidade_origem.ilike(f"%{cidade_origem}%"))
        if uf_destino:
            query_base = query_base.filter(Carga.uf_destino == uf_destino)
        if cidade_destino:
            query_base = query_base.filter(Carga.cidade_destino.ilike(f"%{cidade_destino}%"))
        if rota:
            query_base = query_base.filter(Carga.rota.ilike(f"%{rota}%"))
        if data_inicio:
            query_base = query_base.filter(Carga.data_carregamento >= data_inicio)
        if data_fim:
            query_base = query_base.filter(Carga.data_carregamento <= data_fim)
        if criado_por_id:
            query_base = query_base.filter(Carga.criado_por_id == criado_por_id)
        if criado_por_transportadora:
            query_base = query_base.filter(Carga.criado_por_transportadora.ilike(f"%{criado_por_transportadora}%"))
        if criado_por_filial:
            query_base = query_base.filter(Carga.criado_por_filial.ilike(f"%{criado_por_filial}%"))

        # --- Se filtrou por tipo/motivo, restringe ---
        query_cargas = query_base
        if tipo_ocorrencia_id or motivo_ocorrencia_id:
            query_cargas = query_cargas.join(Carga.ocorrencias).join(OcorrenciaCarga.motivo)
            if tipo_ocorrencia_id:
                query_cargas = query_cargas.filter(MotivoOcorrencia.tipo_id == tipo_ocorrencia_id)
            if motivo_ocorrencia_id:
                query_cargas = query_cargas.filter(OcorrenciaCarga.motivo_id == motivo_ocorrencia_id)

        # --- Subquery segura (DISTINCT isolado) ---
        subq_cargas = query_cargas.with_entities(Carga.id, Carga.valor_frete).distinct(Carga.id).subquery()

        # --- Total e agregados ---
        total_cargas = db.query(func.count(subq_cargas.c.id)).scalar() or 0
        valor_agg = db.query(
            func.coalesce(func.sum(subq_cargas.c.valor_frete), 0),
            func.avg(subq_cargas.c.valor_frete),
            func.min(subq_cargas.c.valor_frete),
            func.max(subq_cargas.c.valor_frete)
        ).first()

        total_valor_frete = float(valor_agg[0] or 0)
        media_valor_frete = float(valor_agg[1] or 0)
        min_valor_frete = float(valor_agg[2] or 0)
        max_valor_frete = float(valor_agg[3] or 0)

        # --- Cria uma query “limpa” para agrupamentos ---
        query_group = query_base  # sem DISTINCT nem joins de ocorrência

        cargas_por_status = dict(
            (status, qtd)
            for status, qtd in query_group.with_entities(Carga.status, func.count(Carga.id))
            .group_by(Carga.status)
            .all()
        )

        cargas_por_uf_origem = dict(
            (uf, qtd)
            for uf, qtd in query_group.with_entities(Carga.uf_origem, func.count(Carga.id))
            .group_by(Carga.uf_origem)
            .all()
        )

        cargas_por_uf_destino = dict(
            (uf, qtd)
            for uf, qtd in query_group.with_entities(Carga.uf_destino, func.count(Carga.id))
            .group_by(Carga.uf_destino)
            .all()
        )

        cargas_por_rota = (
            query_group.with_entities(Carga.rota, func.count(Carga.id))
            .group_by(Carga.rota)
            .order_by(desc(func.count(Carga.id)))
            .limit(10)
            .all()
        )
        top_rotas = [{"rota": r or "", "qtd": int(q)} for r, q in cargas_por_rota]

        por_criador = dict(
            (nome, qtd)
            for nome, qtd in query_group.with_entities(Carga.criado_por_nome, func.count(Carga.id))
            .group_by(Carga.criado_por_nome)
            .all()
            if nome
        )

        por_criador_transportadora = dict(
            (t, qtd)
            for t, qtd in query_group.with_entities(Carga.criado_por_transportadora, func.count(Carga.id))
            .group_by(Carga.criado_por_transportadora)
            .all()
            if t
        )

        por_criador_filial = dict(
            (f, qtd)
            for f, qtd in query_group.with_entities(Carga.criado_por_filial, func.count(Carga.id))
            .group_by(Carga.criado_por_filial)
            .all()
            if f
        )

        top_criadores = [
            {"criado_por_nome": nome, "qtd": int(qtd)}
            for nome, qtd in query_group.with_entities(Carga.criado_por_nome, func.count(Carga.id))
            .group_by(Carga.criado_por_nome)
            .order_by(desc(func.count(Carga.id)))
            .limit(10)
            .all()
        ]

        # --- Ocorrências ---
        query_ocorrencias = db.query(OcorrenciaCarga)
        if tipo_ocorrencia_id:
            query_ocorrencias = query_ocorrencias.join(OcorrenciaCarga.motivo).filter(MotivoOcorrencia.tipo_id == tipo_ocorrencia_id)
        if motivo_ocorrencia_id:
            query_ocorrencias = query_ocorrencias.filter(OcorrenciaCarga.motivo_id == motivo_ocorrencia_id)
        if data_inicio:
            query_ocorrencias = query_ocorrencias.filter(OcorrenciaCarga.criado_em >= data_inicio)
        if data_fim:
            query_ocorrencias = query_ocorrencias.filter(OcorrenciaCarga.criado_em <= data_fim)

        ocorrencias_totais = query_ocorrencias.count()
        ocorrencias_por_tipo = dict(
            (tipo, int(qtd))
            for tipo, qtd in query_ocorrencias.join(OcorrenciaCarga.motivo).join(MotivoOcorrencia.tipo)
            .with_entities(TipoOcorrencia.nome, func.count(OcorrenciaCarga.id))
            .group_by(TipoOcorrencia.nome)
            .all()
        )
        ocorrencias_por_motivo = dict(
            (motivo, int(qtd))
            for motivo, qtd in query_ocorrencias.join(OcorrenciaCarga.motivo)
            .with_entities(MotivoOcorrencia.nome, func.count(OcorrenciaCarga.id))
            .group_by(MotivoOcorrencia.nome)
            .all()
        )
        top_motivos = [
            {"motivo": nome, "qtd": int(qtd)}
            for nome, qtd in query_ocorrencias.join(OcorrenciaCarga.motivo)
            .with_entities(MotivoOcorrencia.nome, func.count(OcorrenciaCarga.id))
            .group_by(MotivoOcorrencia.nome)
            .order_by(desc(func.count(OcorrenciaCarga.id)))
            .limit(10)
            .all()
        ]
        timeline = [
            {"data": str(d), "qtd": int(qty)}
            for d, qty in query_ocorrencias
            .with_entities(func.date(OcorrenciaCarga.criado_em), func.count(OcorrenciaCarga.id))
            .group_by(func.date(OcorrenciaCarga.criado_em))
            .order_by(func.date(OcorrenciaCarga.criado_em))
            .all()
        ]

        # --- Cargas com e sem ocorrências ---
        cargas_com_ocorrencias = (
            db.query(func.count(func.distinct(Carga.id)))
            .select_from(Carga)
            .join(Carga.ocorrencias)
            .filter(Carga.id.in_(db.query(subq_cargas.c.id)))
            .scalar()
        )
        cargas_sem_ocorrencias = max(0, total_cargas - (cargas_com_ocorrencias or 0))

        # --- Lista e top cargas ---
        cargas_objs = (
            query_cargas.options(
                joinedload(Carga.ocorrencias)
                .joinedload(OcorrenciaCarga.motivo)
                .joinedload(MotivoOcorrencia.tipo)
            )
            .order_by(Carga.data_carregamento.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        def carga_to_dict(c):
            return {
                "id": c.id,
                "data_carregamento": c.data_carregamento.isoformat() if c.data_carregamento else None,
                "uf_origem": c.uf_origem,
                "cidade_origem": c.cidade_origem,
                "uf_destino": c.uf_destino,
                "cidade_destino": c.cidade_destino,
                "rota": c.rota,
                "valor_frete": float(c.valor_frete or 0),
                "status": c.status,
                "criado_por_nome": c.criado_por_nome,
                "criado_por_transportadora": c.criado_por_transportadora,
                "criado_por_filial": c.criado_por_filial,
            }

        cargas_list = [carga_to_dict(c) for c in cargas_objs]

        top_cargas_por_valor = [
            carga_to_dict(c)
            for c in query_group.order_by(desc(Carga.valor_frete)).limit(10).all()
        ]

        return {
            "total_cargas": total_cargas,
            "total_valor_frete": total_valor_frete,
            "media_valor_frete": media_valor_frete,
            "min_valor_frete": min_valor_frete,
            "max_valor_frete": max_valor_frete,
            "por_status": cargas_por_status,
            "por_uf_origem": cargas_por_uf_origem,
            "por_uf_destino": cargas_por_uf_destino,
            "top_rotas": top_rotas,
            "por_criador": por_criador,
            "por_criador_transportadora": por_criador_transportadora,
            "por_criador_filial": por_criador_filial,
            "top_criadores": top_criadores,
            "ocorrencias_totais": ocorrencias_totais,
            "ocorrencias_por_tipo": ocorrencias_por_tipo,
            "ocorrencias_por_motivo": ocorrencias_por_motivo,
            "top_motivos": top_motivos,
            "ocorrencias_timeline": timeline,
            "cargas_com_ocorrencias": cargas_com_ocorrencias,
            "cargas_sem_ocorrencias": cargas_sem_ocorrencias,
            "cargas": cargas_list,
        }

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(500, f"Erro no banco de dados: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Erro ao gerar estatísticas: {str(e)}")
