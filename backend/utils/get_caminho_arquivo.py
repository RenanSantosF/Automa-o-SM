from sqlalchemy.orm import Session
from models import DocumentFile
from fastapi import HTTPException


def get_caminho_arquivo_por_id(db: Session, arquivo_id: int) -> str:
    arquivo = db.query(DocumentFile).filter(DocumentFile.id == arquivo_id).first()
    if not arquivo:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return arquivo.caminho_arquivo
