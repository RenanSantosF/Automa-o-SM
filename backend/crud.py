from sqlalchemy.orm import Session
from models import Execucao
import json

def criar_execucao(db: Session, dados: dict):
    execucao = Execucao(
        status="pendente",
        resultado=json.dumps(dados),
        valor_total_carga=float(dados["valor_total_carga"].replace(",", ".")) if dados.get("valor_total_carga") else None,
        placa_cavalo=dados.get("placa_cavalo"),
        placa_carreta_1=dados.get("placa_carreta_1"),
        placa_carreta_2=dados.get("placa_carreta_2"),
        local_origem=dados.get("local_origem"),
        local_destino=dados.get("local_destino"),
        remetente_nome=dados.get("remetente_nome"),
        remetente_cnpj=dados.get("remetente_cnpj"),
        remetente_endereco=dados.get("remetente_endereco"),
        destinatario_nome=dados.get("destinatario_nome"),
        destinatario_cnpj=dados.get("destinatario_cnpj"),
        destinatario_endereco=dados.get("destinatario_endereco"),
        condutor=dados.get("condutor"),
        cpf_condutor=dados.get("cpf_condutor"),

    )
    db.add(execucao)
    db.commit()
    db.refresh(execucao)
    return execucao


def atualizar_status(
        db: Session, 
        execucao_id: int, 
        status: str, 
        resultado: str = None, 
        erro: str = None,
        remetente_cadastrado_apisul: str = None,
        destinatario_cadastrado_apisul: str = None,
        rotas_cadastradas_apisul: list = None
    ):
    execucao = db.query(Execucao).filter(Execucao.id == execucao_id).first()
    if execucao:
        execucao.status = status
        execucao.resultado = resultado
        execucao.erro = erro
        if remetente_cadastrado_apisul is not None:
            execucao.remetente_cadastrado_apisul = remetente_cadastrado_apisul
        if destinatario_cadastrado_apisul is not None:
            execucao.destinatario_cadastrado_apisul = destinatario_cadastrado_apisul
        if rotas_cadastradas_apisul is not None:
            execucao.rotas_cadastradas_apisul = rotas_cadastradas_apisul

        db.commit()

def listar_execucoes(db: Session, limite: int = 100):
    return db.query(Execucao).order_by(Execucao.criado_em.desc()).limit(limite).all()


def buscar_execucao_por_id(db: Session, execucao_id: int):
    # Buscando a execução no banco pelo ID
    return db.query(Execucao).filter(Execucao.id == execucao_id).first()
