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

# Função utilitária para normalizar campos string
def normalize_carga(carga: Carga) -> dict:
    return {
        **carga.__dict__,
        "uf_origem": carga.uf_origem or "",
        "cidade_origem": carga.cidade_origem or "",
        "uf_destino": carga.uf_destino or "",
        "cidade_destino": carga.cidade_destino or "",
        "ocorrencias": [
            {
                **oc.__dict__,
                "observacao": oc.observacao or "",
                "motivo_id": oc.motivo_id or 0,
            }
            for oc in carga.ocorrencias
        ],
    }

# =====================================================
# 📦 CRUD Cargas
# =====================================================

@router.post("/cargas", response_model=CargaSchema)
async def criar_carga(payload: CargaCreateSchema, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        ocorrencias_data = payload.ocorrencias or []
        carga_data = payload.dict(exclude={'ocorrencias'})

        carga = Carga(**carga_data)
        db.add(carga)
        db.flush()

        for ocorrencia_data in ocorrencias_data:
            ocorrencia = OcorrenciaCarga(
                **ocorrencia_data.dict(),
                carga_id=carga.id
            )
            db.add(ocorrencia)

        db.commit()
        db.refresh(carga)

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

    cargas = query.offset(skip).limit(limit).all()
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

        # snapshot das ocorrências existentes
        existing_ocorrencias = {oc.id: oc for oc in carga.ocorrencias if oc.id}
        # índice por signature para corresponder por conteúdo (motivo + observação normalizada)
        def make_signature(motivo_id, observacao):
            return f"{int(motivo_id)}|{(observacao or '').strip().lower()}"

        signature_index = {}
        for oc in carga.ocorrencias:
            if oc.id:
                signature_index[make_signature(oc.motivo_id, oc.observacao)] = oc

        # marcar ids que devem ser mantidos (vindos por id ou por assinatura)
        kept_ids = set()

        for oc_data in ocorrencias_data:
            oc_id = getattr(oc_data, "id", None)
            # normalizar oc_data campos
            motivo_id = getattr(oc_data, "motivo_id", None)
            observacao = getattr(oc_data, "observacao", "") or ""

            # tenta usar id primeiro
            if oc_id is not None:
                try:
                    oc_id_int = int(oc_id)
                except Exception:
                    oc_id_int = None
            else:
                oc_id_int = None

            if oc_id_int and oc_id_int in existing_ocorrencias:
                # atualização simples por id
                ocorr = existing_ocorrencias[oc_id_int]
                ocorr.motivo_id = motivo_id
                ocorr.observacao = observacao
                kept_ids.add(oc_id_int)
                # atualiza também signature_index caso a observação/motivo mude
                signature_index[make_signature(motivo_id, observacao)] = ocorr
            else:
                # tenta achar por signature (evita criar duplicata quando frontend não enviou id)
                sig = make_signature(motivo_id, observacao)
                matched = signature_index.get(sig)
                if matched:
                    # marcamos essa ocorrência como mantida e atualizamos caso algo mude
                    matched.motivo_id = motivo_id
                    matched.observacao = observacao
                    if matched.id:
                        kept_ids.add(matched.id)
                else:
                    # criar nova ocorrência (não existe id nem match)
                    nova = OcorrenciaCarga(
                        motivo_id=motivo_id,
                        observacao=observacao,
                        carga_id=carga_id
                    )
                    db.add(nova)
                    # importante dar flush mais adiante para obter id se necessário

        db.flush()

        # agora reconstruir kept_ids para incluir ocorrências que acabaram de ser criadas e que
        # correspondem ao payload por signature (caso queira evitar deletar algo legítimo).
        # Recriar signature index a partir do DB atual (mais seguro)
        db.refresh(carga)
        current_signatures = {}
        for oc in carga.ocorrencias:
            if oc.id:
                current_signatures[make_signature(oc.motivo_id, oc.observacao)] = oc.id

        # identificar quais assinaturas do payload correspondem a ids atuais e marcar kept_ids
        for oc_data in ocorrencias_data:
            motivo_id = getattr(oc_data, "motivo_id", None)
            observacao = getattr(oc_data, "observacao", "") or ""
            sig = make_signature(motivo_id, observacao)
            if sig in current_signatures:
                kept_ids.add(current_signatures[sig])

        # apagar somente ocorrências que EXISTIAM antes e que não foram mantidas
        original_ids = {oc.id for oc in carga.ocorrencias if oc.id}  # após refresh, contém atuais também
        # Mas queremos comparar contra o conjunto que existia originalmente antes de criarmos novas.
        # Para isso carregamos os ids originais do DB via consulta sem alterações:
        orig_query_ids = {r[0] for r in db.query(OcorrenciaCarga.id).filter(OcorrenciaCarga.carga_id == carga_id).all()}

        # to_remove = orig_before_update - kept_ids
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
    tipo = db.query(TipoOcorrencia).filter(TipoOcorrencia.id == tipo_id).first()
    if not tipo:
        raise HTTPException(404, "Tipo não encontrado")
    db.delete(tipo)
    db.commit()
    return {"ok": True}


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
    db.delete(motivo)
    db.commit()
    return {"ok": True}


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
    skip: int = 0,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Estatísticas avançadas para o gestor de cargas.

    Retorna:
      - totais (quantidade de cargas)
      - agregações de valor (soma, média, min, max)
      - por_status, por_uf_origem, por_uf_destino
      - top rotas
      - ocorrências totais, por tipo, por motivo, timeline diária
      - contagem de cargas com/sem ocorrências
      - top motivos
      - lista paginada de cargas (cada carga com ocorrências aninhadas)
    """
    try:
        # --- Aplicar filtros nas cargas (base) ---
        query_cargas = db.query(Carga)

        if uf_origem:
            query_cargas = query_cargas.filter(Carga.uf_origem == uf_origem)
        if cidade_origem:
            query_cargas = query_cargas.filter(Carga.cidade_origem.ilike(f"%{cidade_origem}%"))
        if uf_destino:
            query_cargas = query_cargas.filter(Carga.uf_destino == uf_destino)
        if cidade_destino:
            query_cargas = query_cargas.filter(Carga.cidade_destino.ilike(f"%{cidade_destino}%"))
        if rota:
            query_cargas = query_cargas.filter(Carga.rota.ilike(f"%{rota}%"))
        if data_inicio:
            query_cargas = query_cargas.filter(Carga.data_carregamento >= data_inicio)
        if data_fim:
            query_cargas = query_cargas.filter(Carga.data_carregamento <= data_fim)

        # ------- NOVO: se filtrou por tipo/motivo de ocorrência, limitar cargas
        # A ideia: restringir a query_cargas apenas às cargas que tenham ocorrências
        # correspondentes aos filtros tipo_ocorrencia_id / motivo_ocorrencia_id.
        if tipo_ocorrencia_id or motivo_ocorrencia_id:
            # Faz join via relacionamento (Carga.ocorrencias) e MotivoOcorrencia
            # e aplica os filtros de ocorrência; usa distinct para não duplicar cargas
            query_cargas = query_cargas.join(Carga.ocorrencias).join(OcorrenciaCarga.motivo)
            if tipo_ocorrencia_id:
                query_cargas = query_cargas.filter(MotivoOcorrencia.tipo_id == tipo_ocorrencia_id)
            if motivo_ocorrencia_id:
                query_cargas = query_cargas.filter(OcorrenciaCarga.motivo_id == motivo_ocorrencia_id)
            query_cargas = query_cargas.distinct()

        # materializar total de cargas com os filtros aplicados
        total_cargas = query_cargas.count()

        # --- Agregados de valor ---
        valor_agg = query_cargas.with_entities(
            func.coalesce(func.sum(Carga.valor_frete), 0),
            func.avg(Carga.valor_frete),
            func.min(Carga.valor_frete),
            func.max(Carga.valor_frete)
        ).first()
        total_valor_frete = float(valor_agg[0]) if valor_agg and valor_agg[0] is not None else 0.0
        media_valor_frete = float(valor_agg[1]) if valor_agg and valor_agg[1] is not None else 0.0
        min_valor_frete = float(valor_agg[2]) if valor_agg and valor_agg[2] is not None else 0.0
        max_valor_frete = float(valor_agg[3]) if valor_agg and valor_agg[3] is not None else 0.0

        # --- Cargas por status, uf origem, uf destino ---
        cargas_por_status = dict(
            (status, qtd) for status, qtd in
            query_cargas.with_entities(Carga.status, func.count(Carga.id)).group_by(Carga.status).all()
        )

        cargas_por_uf_origem = dict(
            (uf, qtd) for uf, qtd in
            query_cargas.with_entities(Carga.uf_origem, func.count(Carga.id)).group_by(Carga.uf_origem).all()
        )

        cargas_por_uf_destino = dict(
            (uf, qtd) for uf, qtd in
            query_cargas.with_entities(Carga.uf_destino, func.count(Carga.id)).group_by(Carga.uf_destino).all()
        )

        # --- Top rotas (mais frequentes) ---
        cargas_por_rota = query_cargas.with_entities(
            Carga.rota, func.count(Carga.id)
        ).group_by(Carga.rota).order_by(desc(func.count(Carga.id))).limit(10).all()
        top_rotas = [{ "rota": r or "", "qtd": int(q) } for r, q in cargas_por_rota]

        # --- Ocorrências: construir query com mesmos filtros (quando necessário filtrar por carga) ---
        query_ocorrencias = db.query(OcorrenciaCarga)

        # se filtros geográficos/rota foram aplicados, junte com carga para filtrar ocorrências vinculadas
        if uf_origem or cidade_origem or uf_destino or cidade_destino or rota:
            query_ocorrencias = query_ocorrencias.join(OcorrenciaCarga.carga)
            if uf_origem:
                query_ocorrencias = query_ocorrencias.filter(Carga.uf_origem == uf_origem)
            if cidade_origem:
                query_ocorrencias = query_ocorrencias.filter(Carga.cidade_origem.ilike(f"%{cidade_origem}%"))
            if uf_destino:
                query_ocorrencias = query_ocorrencias.filter(Carga.uf_destino == uf_destino)
            if cidade_destino:
                query_ocorrencias = query_ocorrencias.filter(Carga.cidade_destino.ilike(f"%{cidade_destino}%"))
            if rota:
                query_ocorrencias = query_ocorrencias.filter(Carga.rota.ilike(f"%{rota}%"))

        if tipo_ocorrencia_id:
            query_ocorrencias = query_ocorrencias.join(OcorrenciaCarga.motivo).filter(MotivoOcorrencia.tipo_id == tipo_ocorrencia_id)
        if motivo_ocorrencia_id:
            query_ocorrencias = query_ocorrencias.filter(OcorrenciaCarga.motivo_id == motivo_ocorrencia_id)
        if data_inicio:
            query_ocorrencias = query_ocorrencias.filter(OcorrenciaCarga.criado_em >= data_inicio)
        if data_fim:
            query_ocorrencias = query_ocorrencias.filter(OcorrenciaCarga.criado_em <= data_fim)

        ocorrencias_totais = query_ocorrencias.count()

        # ocorrências por tipo e por motivo
        ocorrencias_por_tipo = dict(
            (tipo, int(qtd)) for tipo, qtd in
            query_ocorrencias.join(OcorrenciaCarga.motivo).join(MotivoOcorrencia.tipo)
            .with_entities(TipoOcorrencia.nome, func.count(OcorrenciaCarga.id))
            .group_by(TipoOcorrencia.nome)
            .all()
        )

        ocorrencias_por_motivo = dict(
            (motivo, int(qtd)) for motivo, qtd in
            query_ocorrencias.join(OcorrenciaCarga.motivo)
            .with_entities(MotivoOcorrencia.nome, func.count(OcorrenciaCarga.id))
            .group_by(MotivoOcorrencia.nome)
            .all()
        )

        # top motivos
        top_motivos = [
            {"motivo": nome, "qtd": int(qtd)}
            for nome, qtd in query_ocorrencias.join(OcorrenciaCarga.motivo)
                .with_entities(MotivoOcorrencia.nome, func.count(OcorrenciaCarga.id))
                .group_by(MotivoOcorrencia.nome)
                .order_by(desc(func.count(OcorrenciaCarga.id)))
                .limit(10).all()
        ]

        # timeline diária de ocorrências (por data)
        timeline = [
            {"data": str(d), "qtd": int(qty)}
            for d, qty in query_ocorrencias
                .with_entities(func.date(OcorrenciaCarga.criado_em), func.count(OcorrenciaCarga.id))
                .group_by(func.date(OcorrenciaCarga.criado_em))
                .order_by(func.date(OcorrenciaCarga.criado_em))
                .all()
        ]

        # contagem de cargas com e sem ocorrências (considerando os filtros aplicados às cargas)
        cargas_com_ocorrencias_q = db.query(Carga.id).join(Carga.ocorrencias)

        # reaplicar filtros para essa query (para corresponder ao conjunto de cargas usado em total_cargas)
        if uf_origem:
            cargas_com_ocorrencias_q = cargas_com_ocorrencias_q.filter(Carga.uf_origem == uf_origem)
        if cidade_origem:
            cargas_com_ocorrencias_q = cargas_com_ocorrencias_q.filter(Carga.cidade_origem.ilike(f"%{cidade_origem}%"))
        if uf_destino:
            cargas_com_ocorrencias_q = cargas_com_ocorrencias_q.filter(Carga.uf_destino == uf_destino)
        if cidade_destino:
            cargas_com_ocorrencias_q = cargas_com_ocorrencias_q.filter(Carga.cidade_destino.ilike(f"%{cidade_destino}%"))
        if rota:
            cargas_com_ocorrencias_q = cargas_com_ocorrencias_q.filter(Carga.rota.ilike(f"%{rota}%"))
        if data_inicio:
            cargas_com_ocorrencias_q = cargas_com_ocorrencias_q.filter(Carga.data_carregamento >= data_inicio)
        if data_fim:
            cargas_com_ocorrencias_q = cargas_com_ocorrencias_q.filter(Carga.data_carregamento <= data_fim)

        cargas_com_ocorrencias = cargas_com_ocorrencias_q.distinct().count()
        cargas_sem_ocorrencias = max(0, total_cargas - cargas_com_ocorrencias)

        # --- Lista de cargas (paginação) com ocorrências aninhadas (limit/skip) ---
        cargas_query_for_list = query_cargas.options(
            joinedload(Carga.ocorrencias).joinedload(OcorrenciaCarga.motivo).joinedload(MotivoOcorrencia.tipo)
        ).order_by(Carga.data_carregamento.desc())

        cargas_objs = cargas_query_for_list.offset(skip).limit(limit).all()

        def carga_to_dict(c):
            return {
                "id": c.id,
                "data_carregamento": c.data_carregamento.isoformat() if getattr(c, "data_carregamento", None) else None,
                "uf_origem": c.uf_origem,
                "cidade_origem": c.cidade_origem,
                "uf_destino": c.uf_destino,
                "cidade_destino": c.cidade_destino,
                "rota": c.rota,
                "valor_frete": float(c.valor_frete or 0),
                "status": c.status,
                "observacao_cliente": c.observacao_cliente,
                "criado_em": c.criado_em.isoformat() if getattr(c, "criado_em", None) else None,
                "atualizado_em": c.atualizado_em.isoformat() if getattr(c, "atualizado_em", None) else None,
                "ocorrencias": [
                    {
                        "id": oc.id,
                        "motivo_id": oc.motivo_id,
                        "motivo_nome": getattr(oc.motivo, "nome", None),
                        "tipo_id": getattr(oc.motivo.tipo, "id", None) if oc.motivo else None,
                        "tipo_nome": getattr(oc.motivo.tipo, "nome", None) if oc.motivo else None,
                        "observacao": oc.observacao,
                        "criado_em": oc.criado_em.isoformat() if getattr(oc, "criado_em", None) else None
                    }
                    for oc in (c.ocorrencias or [])
                ]
            }

        cargas_list = [carga_to_dict(c) for c in cargas_objs]

        # top cargas por valor do frete (maiores)
        top_cargas_por_valor = [
            {
                "id": c.id,
                "data_carregamento": c.data_carregamento.isoformat() if getattr(c, "data_carregamento", None) else None,
                "valor_frete": float(c.valor_frete or 0),
                "uf_origem": c.uf_origem,
                "cidade_origem": c.cidade_origem,
                "uf_destino": c.uf_destino,
                "cidade_destino": c.cidade_destino,
            }
            for c in
            query_cargas.order_by(desc(Carga.valor_frete)).limit(10).all()
        ]

        result = {
            "total_cargas": total_cargas,
            "total_valor_frete": total_valor_frete,
            "media_valor_frete": media_valor_frete,
            "min_valor_frete": min_valor_frete,
            "max_valor_frete": max_valor_frete,
            "por_status": cargas_por_status,
            "por_uf_origem": cargas_por_uf_origem,
            "por_uf_destino": cargas_por_uf_destino,
            "top_rotas": top_rotas,
            "top_cargas_por_valor": top_cargas_por_valor,
            "ocorrencias_totais": ocorrencias_totais,
            "ocorrencias_por_tipo": ocorrencias_por_tipo,
            "ocorrencias_por_motivo": ocorrencias_por_motivo,
            "top_motivos": top_motivos,
            "ocorrencias_timeline": timeline,
            "cargas_com_ocorrencias": cargas_com_ocorrencias,
            "cargas_sem_ocorrencias": cargas_sem_ocorrencias,
            "cargas": cargas_list,
            "cargas_pagination": {"skip": skip, "limit": limit, "returned": len(cargas_list)},
        }

        return result

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(500, f"Erro no banco de dados: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Erro ao gerar estatísticas: {str(e)}")