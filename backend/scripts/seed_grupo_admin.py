import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
from models_gerais.permissoes import Grupo, Permissao

db = SessionLocal()

# cria grupo Admin se não existir
grupo = db.query(Grupo).filter_by(nome="Admin").first()

if not grupo:
    grupo = Grupo(
        nome="Admin",
        descricao="Acesso total ao sistema"
    )
    db.add(grupo)
    db.commit()
    db.refresh(grupo)

# associa TODAS as permissões
grupo.permissoes = db.query(Permissao).all()
db.commit()

print("Grupo Admin criado com todas as permissões!")
