import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import models_gerais

from database import SessionLocal
from models import User
from models_gerais.permissoes import Grupo

db = SessionLocal()

usuario = db.query(User).filter_by(username="renan2").first()
grupo = db.query(Grupo).filter_by(nome="Admin").first()

if not usuario:
    print("Usuário não encontrado")
    exit()

usuario.grupo_id = grupo.id
db.commit()

print(f"Usuário {usuario.username} agora é Admin")
