

import sys
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


from database import SessionLocal
from models_gerais.permissoes import Permissao

db = SessionLocal()

permissoes = [
    "comprovantes.aprovar",
    "comprovantes.reprovar",
    "comprovantes.deletar",
    "comprovantes.view_all",
    "comprovantes.comentar",
    "comprovantes.solicitar_aprovacao_novamente",
    "comprovantes.liberar_saldo",
    "comprovantes.baixar_manifesto",
    "comprovantes.criar",
    "comprovantes.acessar_pagina",


    "execucoes.reprocessar",
    "execucoes.deletar",
    "execucoes.criar",
    "execucoes.acessar_pagina",


    "cargas.create",
    "cargas.edit",
    "cargas.delete",
    "cargas.view_all",

    "usuarios.list",
    "usuarios.edit",
    "usuarios.delete",

    "base_de_conhecimento.criar",
    "base_de_conhecimento.editar",
    "base_de_conhecimento.deletar",
    "base_de_conhecimento.acessar_pagina",

    "baixar_nfes.baixar",
    "baixar_nfes.baixar_por_xml_cte",
    "baixar_nfes.acessar_pagina",

    "cargas.criar",
    "cargas.editar",
    "cargas.deletar",
    "cargas.relatorio",
    "cargas.acessar_pagina",

    "ocorrencias.tipos.criar",
    "ocorrencias.tipos.editar",
    "ocorrencias.tipos.deletar",
    "ocorrencias.tipos.acessar_pagina",
    "ocorrencias.motivos.criar",
    "ocorrencias.motivos.editar",
    "ocorrencias.motivos.deletar",
    "ocorrencias.motivos.acessar_pagina",

]

for codigo in permissoes:
    existe = db.query(Permissao).filter_by(codigo=codigo).first()
    if not existe:
        db.add(Permissao(codigo=codigo))

db.commit()
print("Permissões criadas!")
