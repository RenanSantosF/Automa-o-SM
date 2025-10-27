from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
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
from datetime import date
from sqlalchemy import func


router = APIRouter(
    prefix="/gestor-cargas",
    tags=["Gestor de Cargas"],
)

# -------------------
# 📦 CRUD Cargas
# -------------------

@router.post("/cargas", response_model=CargaSchema)
async def criar_carga(
    payload: CargaCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        print("Payload recebido:", payload.dict())
        
        # Garanta que ocorrencias seja sempre uma lista
        ocorrencias_data = payload.ocorrencias or []
        carga_data = payload.dict(exclude={'ocorrencias'})
        
        print("Dados da carga:", carga_data)
        print("Ocorrências a processar:", ocorrencias_data)
        
        # Cria a carga
        carga = Carga(**carga_data)
        db.add(carga)
        db.flush()  # Obtém o ID sem commit completo
        
        # Cria as ocorrências associadas à carga
        for ocorrencia_data in ocorrencias_data:
            ocorrencia = OcorrenciaCarga(
                **ocorrencia_data.dict(),
                carga_id=carga.id
            )
            db.add(ocorrencia)
        
        db.commit()
        
        # 🔥 AGORA RECARREGUE A CARGA COM AS OCORRÊNCIAS 🔥
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
        
        print("Carga retornada com ocorrências:", len(carga_completa.ocorrencias) if carga_completa else 0)
        return carga_completa
        
    except Exception as e:
        db.rollback()
        print(f"Erro detalhado: {str(e)}")
        raise HTTPException(500, f"Erro ao criar carga: {str(e)}")


from sqlalchemy.orm import joinedload

@router.get("/cargas", response_model=List[CargaSchema])
async def listar_cargas(
    skip: int = 0,
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = None,
    origem: Optional[str] = None,
    destino: Optional[str] = None,
    rota: Optional[str] = None,
    valor_min: Optional[float] = None,
    valor_max: Optional[float] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Carga).options(
        joinedload(Carga.ocorrencias).joinedload(OcorrenciaCarga.motivo).joinedload(MotivoOcorrencia.tipo)
    )

    if status:
        query = query.filter(Carga.status == status)
    if origem:
        query = query.filter(Carga.origem.ilike(f"%{origem}%"))
    if destino:
        query = query.filter(Carga.destino.ilike(f"%{destino}%"))
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
    return cargas


@router.get("/cargas/{carga_id}", response_model=CargaSchema)
async def obter_carga(
    carga_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    carga = (
        db.query(Carga)
        .options(joinedload(Carga.ocorrencias).joinedload(OcorrenciaCarga.motivo).joinedload(MotivoOcorrencia.tipo))
        .filter(Carga.id == carga_id)
        .first()
    )
    if not carga:
        raise HTTPException(404, "Carga não encontrada")
    return carga



from fastapi import Body, HTTPException, Depends
from sqlalchemy.orm import joinedload, Session
from sqlalchemy.exc import SQLAlchemyError

@router.put("/cargas/{carga_id}", response_model=CargaSchema)
async def atualizar_carga(
    carga_id: int,
    payload: CargaUpdateSchema = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        carga = db.query(Carga).filter(Carga.id == carga_id).first()
        if not carga:
            raise HTTPException(404, "Carga não encontrada")

        print("Payload recebido para atualização:", payload.dict())

        # Garante que ocorrencias seja sempre uma lista
        ocorrencias_data = payload.ocorrencias or []

        # Atualiza campos da carga (exceto ocorrencias)
        carga_data = {k: v for k, v in payload.dict(exclude={'ocorrencias'}).items() if v is not None}
        for field, value in carga_data.items():
            setattr(carga, field, value)

        # Processar ocorrências
        ids_payload = []
        for ocorrencia_data in ocorrencias_data:
            if ocorrencia_data.id:  # Atualiza existente
                ocorrencia = db.query(OcorrenciaCarga).filter_by(
                    id=ocorrencia_data.id, carga_id=carga_id
                ).first()
                if ocorrencia:
                    ocorrencia.motivo_id = ocorrencia_data.motivo_id
                    ocorrencia.observacao = ocorrencia_data.observacao
                    ids_payload.append(ocorrencia.id)
            else:  # Nova ocorrência
                nova_ocorrencia = OcorrenciaCarga(
                    motivo_id=ocorrencia_data.motivo_id,
                    observacao=ocorrencia_data.observacao,
                    carga_id=carga_id
                )
                db.add(nova_ocorrencia)

        # Commit parcial para gerar IDs das novas ocorrências
        db.flush()

        # Atualiza lista de IDs incluindo os recém-criados
        ids_payload.extend([oc.id for oc in carga.ocorrencias if oc.id])

        # Remover ocorrências que não vieram no payload
        db.query(OcorrenciaCarga).filter(
            OcorrenciaCarga.carga_id == carga_id,
            ~OcorrenciaCarga.id.in_(ids_payload)
        ).delete(synchronize_session=False)

        db.commit()

        # Recarrega carga com relacionamentos
        carga_completa = (
            db.query(Carga)
            .options(
                joinedload(Carga.ocorrencias)
                .joinedload(OcorrenciaCarga.motivo)
                .joinedload(MotivoOcorrencia.tipo)
            )
            .filter(Carga.id == carga_id)
            .first()
        )

        print("Carga atualizada com ocorrências:", len(carga_completa.ocorrencias) if carga_completa else 0)
        return carga_completa

    except SQLAlchemyError as e:
        db.rollback()
        print(f"Erro de banco na atualização: {str(e)}")
        raise HTTPException(500, f"Erro ao atualizar carga: {str(e)}")
    except Exception as e:
        db.rollback()
        print(f"Erro inesperado na atualização: {str(e)}")
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


# -------------------
# 📑 CRUD Tipos de Ocorrência
# -------------------

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
# ⚡ CRUD Motivos de Ocorrência
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
# 🔗 CRUD Ocorrências de Carga
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
    query = db.query(OcorrenciaCarga)\
        .options(selectinload(OcorrenciaCarga.carga), selectinload(OcorrenciaCarga.motivo))

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

    ocorrencias = query.offset(skip).limit(limit).all()
    return ocorrencias



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



from datetime import date
from sqlalchemy import func

@router.get("/estatisticas")
async def estatisticas(
    origem: Optional[str] = None,
    destino: Optional[str] = None,
    rota: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # -------------------------------
    # 📦 Filtro base para cargas
    # -------------------------------
    query_cargas = db.query(Carga)

    if origem:
        query_cargas = query_cargas.filter(Carga.origem.ilike(f"%{origem}%"))
    if destino:
        query_cargas = query_cargas.filter(Carga.destino.ilike(f"%{destino}%"))
    if rota:
        query_cargas = query_cargas.filter(Carga.rota.ilike(f"%{rota}%"))
    if data_inicio:
        query_cargas = query_cargas.filter(Carga.data_carregamento >= data_inicio)
    if data_fim:
        query_cargas = query_cargas.filter(Carga.data_carregamento <= data_fim)

    # --- Totais de cargas por status ---
    cargas_por_status = (
        query_cargas.with_entities(Carga.status, func.count(Carga.id))
        .group_by(Carga.status)
        .all()
    )
    cargas_dict = {status: total for status, total in cargas_por_status}

    total_cargas = query_cargas.with_entities(func.count(Carga.id)).scalar()

    # -------------------------------
    # ⚡ Filtro base para ocorrências
    # -------------------------------
    query_ocorrencias = (
        db.query(OcorrenciaCarga)
        .join(Carga, OcorrenciaCarga.carga_id == Carga.id)
    )

    if origem:
        query_ocorrencias = query_ocorrencias.filter(Carga.origem.ilike(f"%{origem}%"))
    if destino:
        query_ocorrencias = query_ocorrencias.filter(Carga.destino.ilike(f"%{destino}%"))
    if rota:
        query_ocorrencias = query_ocorrencias.filter(Carga.rota.ilike(f"%{rota}%"))
    if data_inicio:
        query_ocorrencias = query_ocorrencias.filter(Carga.data_carregamento >= data_inicio)
    if data_fim:
        query_ocorrencias = query_ocorrencias.filter(Carga.data_carregamento <= data_fim)

    # --- Ocorrências por tipo ---
    ocorrencias_por_tipo = (
        query_ocorrencias
        .join(MotivoOcorrencia, OcorrenciaCarga.motivo_id == MotivoOcorrencia.id)
        .join(TipoOcorrencia, MotivoOcorrencia.tipo_id == TipoOcorrencia.id)
        .with_entities(TipoOcorrencia.nome, func.count(OcorrenciaCarga.id))
        .group_by(TipoOcorrencia.nome)
        .all()
    )
    ocorrencias_dict = {tipo: total for tipo, total in ocorrencias_por_tipo}

    # --- Ocorrências por motivo ---
    ocorrencias_por_motivo = (
        query_ocorrencias
        .join(MotivoOcorrencia, OcorrenciaCarga.motivo_id == MotivoOcorrencia.id)
        .with_entities(MotivoOcorrencia.nome, func.count(OcorrenciaCarga.id))
        .group_by(MotivoOcorrencia.nome)
        .all()
    )
    motivos_dict = {motivo: total for motivo, total in ocorrencias_por_motivo}

    total_ocorrencias = query_ocorrencias.with_entities(func.count(OcorrenciaCarga.id)).scalar()

    return {
        "totais": {
            "cargas": total_cargas,
            "ocorrencias": total_ocorrencias,
        },
        "cargas_por_status": cargas_dict,
        "ocorrencias_por_tipo": ocorrencias_dict,
        "ocorrencias_por_motivo": motivos_dict,
    }
