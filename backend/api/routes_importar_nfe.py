from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import CTe, NFe
from schemas.payloads import CTeCreate
from services.fetch_nfe_xmls import buscar_e_enviar_nfes  # função async
import asyncio
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/importa-e-processa-recentes")
async def importar_ctes(ctes: list[CTeCreate], db: Session = Depends(get_db)):
    ctes_ids = []

    for cte_data in ctes:
        cte = CTe(
            nome=cte_data.nome,
            xml=cte_data.xml,
            solicitacao_id=cte_data.solicitacao_id  # 🔥 Incluindo aqui
        )
        db.add(cte)
        db.flush()

        ctes_ids.append(cte.id)

        for nota_data in cte_data.notas:
            nfe = NFe(
                chave=nota_data.chave,
                cte_id=cte.id,
                status="processando",
                historico=["📥 NFe importada e enviada para processamento."]
            )
            db.add(nfe)

    db.commit()

    nfes_recente = db.query(NFe).filter(
        NFe.cte_id.in_(ctes_ids),
        NFe.baixado == False
    ).all()

    chaves = [nfe.chave for nfe in nfes_recente]

    print("Chaves que serão processadas:", chaves)

    await buscar_e_enviar_nfes(
        db, chaves,
        "nfs@dellmar.com.br", "expedicao@dellmar.com.br",
        "./temp_nfes"
    )

    return {"status": "NFes recentes processadas com sucesso"}



@router.post("/reprocessar-erros")
async def reprocessar_erros(db: Session = Depends(get_db)):
    nfes_com_erro = db.query(NFe).filter(
        NFe.status == "erro",
        NFe.baixado == False
    ).all()

    if not nfes_com_erro:
        return {"status": "Nenhuma NFe com erro para reprocessar"}

    chaves = []
    for nfe in nfes_com_erro:
        nfe.status = "processando"
        if not nfe.historico:
            nfe.historico = []
        nfe.historico.append("♻️ Reprocessamento iniciado para NFe com erro.")
        db.add(nfe)
        chaves.append(nfe.chave)

    db.commit()

    await buscar_e_enviar_nfes(db, chaves, "nfs@dellmar.com.br", "expedicao@dellmar.com.br", "./temp_nfes")

    return {"status": "Reprocessamento de erros concluído"}



@router.post("/reprocessar-nao-baixadas")
async def reprocessar_nao_baixadas(db: Session = Depends(get_db)):
    nfes_pendentes = db.query(NFe).filter(
        NFe.baixado == False
    ).all()

    if not nfes_pendentes:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": "Nenhuma NFe pendente para reprocessar."}
        )

    chaves = [nfe.chave for nfe in nfes_pendentes]

    for nfe in nfes_pendentes:
        nfe.status = "processando"
        nfe.historico.append("♻️ Reprocessamento de NFe pendente iniciado.")
        db.add(nfe)

    db.commit()

    await buscar_e_enviar_nfes(
        db, chaves,
        "nfs@dellmar.com.br", "expedicao@dellmar.com.br",
        "./temp_nfes"
    )

    return {"status": f"Reprocessamento de {len(chaves)} NFes pendentes concluído."}



@router.post("/reprocessa-solicitacao/{solicitacao_id}")
async def reprocessar_solicitacao(solicitacao_id: str, db: Session = Depends(get_db)):
    nfes = db.query(NFe).join(CTe).filter(
        CTe.solicitacao_id == solicitacao_id
    ).all()

    if not nfes:
        return {
            "status": "empty",
            "message": f"Nenhuma NFe encontrada para a solicitação {solicitacao_id}"
        }

    chaves = [nfe.chave for nfe in nfes]

    print(f"Reprocessando {len(chaves)} NFes da solicitação {solicitacao_id}...")

    await buscar_e_enviar_nfes(
        db, chaves,
        "nfs@dellmar.com.br", "expedicao@dellmar.com.br",
        "./temp_nfes"
    )

    return {
        "status": "success",
        "message": f"NFes da solicitação {solicitacao_id} reprocessadas com sucesso"
    }




@router.post("/reprocessar-erros/{solicitacao_id}")
async def reprocessar_erros_solicitacao(solicitacao_id: str, db: Session = Depends(get_db)):
    nfes_com_erro = db.query(NFe).join(CTe).filter(
        NFe.status == "erro",
        NFe.baixado == False,
        CTe.solicitacao_id == solicitacao_id
    ).all()

    if not nfes_com_erro:
        return {"status": f"Nenhuma NFe com erro para reprocessar na solicitação {solicitacao_id}"}

    chaves = []
    for nfe in nfes_com_erro:
        nfe.status = "processando"
        if not nfe.historico:
            nfe.historico = []
        nfe.historico.append(f"♻️ Reprocessamento iniciado para NFe com erro da solicitação {solicitacao_id}.")
        db.add(nfe)
        chaves.append(nfe.chave)

    db.commit()

    await buscar_e_enviar_nfes(db, chaves, "nfs@dellmar.com.br", "expedicao@dellmar.com.br", "./temp_nfes")

    return {"status": f"Reprocessamento de erros concluído para a solicitação {solicitacao_id}"}


from fastapi import Query



@router.get("/solicitacoes")
def listar_solicitacoes(
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1),
    offset: int = Query(0, ge=0),
):
    solicitacoes = (
        db.query(CTe.solicitacao_id)
        .distinct()
        .limit(limit)
        .offset(offset)
        .all()
    )

    resultado = []
    for (solicitacao_id,) in solicitacoes:
        ctes = db.query(CTe).filter(CTe.solicitacao_id == solicitacao_id).all()
        ctes_formatados = []
        for cte in ctes:
            nfes = db.query(NFe).filter(NFe.cte_id == cte.id).all()
            ctes_formatados.append({
                "id": cte.id,
                "nome": cte.nome,
                "nfes": [
                    {
                        "id": nfe.id,
                        "chave": nfe.chave,
                        "status": nfe.status,
                        "baixado": nfe.baixado,
                        "historico": nfe.historico,
                    }
                    for nfe in nfes
                ]
            })
        resultado.append({
            "solicitacao_id": solicitacao_id,
            "ctes": ctes_formatados
        })

    return {"solicitacoes": resultado}


@router.delete("/solicitacao/{solicitacao_id}")
def excluir_solicitacao(solicitacao_id: str, db: Session = Depends(get_db)):
    ctes = db.query(CTe).filter(CTe.solicitacao_id == solicitacao_id).all()

    if not ctes:
        raise HTTPException(
            status_code=404,
            detail=f"Nenhum CTe encontrado para a solicitação {solicitacao_id}"
        )

    for cte in ctes:
        db.delete(cte)  # 🔥 As NFes vinculadas são deletadas automaticamente por causa do cascade

    db.commit()

    return {"status": "success", "message": f"Solicitação {solicitacao_id} excluída com sucesso."}
