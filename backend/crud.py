from sqlalchemy.orm import Session
from models import Execucao
import json
from datetime import datetime

def criar_execucao(db: Session, dados: dict):
    execucao = Execucao(
        status="Solicitação em andamento",
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


def adicionar_evento(historico_atual, mensagem):
    agora = datetime.now().strftime("%d/%m %H:%M")
    evento = f"{agora} {mensagem}"
    if not historico_atual:
        return [evento]
    return historico_atual + [evento]

def atualizar_status(
        db: Session, 
        execucao_id: int, 
        status: str, 
        resultado: str = None, 
        erro: str = None,
        remetente_cadastrado_apisul: str = None,
        destinatario_cadastrado_apisul: str = None,
        rotas_cadastradas_apisul: list = None,
        rota_selecionada: str = None
    ):
    execucao = db.query(Execucao).filter(Execucao.id == execucao_id).first()
    if execucao:
        execucao.status = status
        execucao.resultado = resultado
        
        
        # Atualiza histórico
        mensagem = "Erro: " + erro if erro else f"{status}"
        execucao.historico = adicionar_evento(execucao.historico, mensagem)
        
        if remetente_cadastrado_apisul is not None:
            execucao.remetente_cadastrado_apisul = remetente_cadastrado_apisul
        if destinatario_cadastrado_apisul is not None:
            execucao.destinatario_cadastrado_apisul = destinatario_cadastrado_apisul
        if rotas_cadastradas_apisul is not None:
            execucao.rotas_cadastradas_apisul = rotas_cadastradas_apisul
        if rota_selecionada is not None:
            execucao.rota_selecionada = rota_selecionada

        db.commit()

def listar_execucoes(db: Session, limite: int = 20, offset: int = 0):
    return db.query(Execucao)\
             .order_by(Execucao.criado_em.desc())\
             .offset(offset)\
             .limit(limite)\
             .all()


def buscar_execucao_por_id(db: Session, execucao_id: int):
    # Buscando a execução no banco pelo ID
    return db.query(Execucao).filter(Execucao.id == execucao_id).first()
