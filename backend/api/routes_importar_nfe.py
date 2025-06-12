from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import CTe, NFe
from schemas.payloads import CTeCreate
from services.fetch_nfe_xmls import buscar_e_enviar_nfes  # função async
import asyncio

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/importacaotoemailnfe")
async def importar_ctes(ctes: list[CTeCreate], db: Session = Depends(get_db)):
    ctes_ids = []

    for cte_data in ctes:
        cte = CTe(nome=cte_data.nome, xml=cte_data.xml)
        db.add(cte)
        db.flush()  # para garantir que cte.id está disponível
        ctes_ids.append(cte.id)
        for nota_data in cte_data.notas:
            db.add(NFe(chave=nota_data.chave, cte_id=cte.id))
    db.commit()

    nfes_recente = db.query(NFe).filter(
        NFe.cte_id.in_(ctes_ids),
        NFe.baixado == False
    ).all()

    chaves = [nfe.chave for nfe in nfes_recente]

    print("Chaves que serão processadas:", chaves)

    # Aqui usamos await pois buscar_e_enviar_nfes é async
    await buscar_e_enviar_nfes(db, chaves, "renan_ferreira.es@outlook.com", "./temp_nfes")

    return {"status": "Importado e enviado com sucesso"}
