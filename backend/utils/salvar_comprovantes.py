import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def salvar_comprovante(file: UploadFile) -> str:
    # Pega a extensão original
    extensao = file.filename.split('.')[-1] if '.' in file.filename else ''
    # Gera um nome único
    nome_unico = f"{uuid.uuid4()}.{extensao}" if extensao else str(uuid.uuid4())
    file_location = os.path.join(UPLOAD_DIR, nome_unico)

    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())

    return file_location
