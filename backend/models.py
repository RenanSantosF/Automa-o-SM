from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.sql import func
from database import Base  # ou como você estiver importando sua base declarativa

class Execucao(Base):
    __tablename__ = "execucoes"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="Solicitação em andamento")  # pendente, sucesso, erro
    resultado = Column(Text, nullable=True)
    erro = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Novos campos
    valor_total_carga = Column(Float, nullable=True)
    placa_cavalo = Column(String, nullable=True)
    placa_carreta_1 = Column(String, nullable=True)
    placa_carreta_2 = Column(String, nullable=True)
    local_origem = Column(String, nullable=True)
    local_destino = Column(String, nullable=True)
    remetente_nome = Column(String, nullable=True)
    remetente_cnpj = Column(String, nullable=True)
    remetente_endereco = Column(String, nullable=True)
    destinatario_nome = Column(String, nullable=True)
    destinatario_cnpj = Column(String, nullable=True)
    destinatario_endereco = Column(String, nullable=True)
    condutor = Column(String, nullable=True)
    cpf_condutor = Column(String, nullable=True)


    remetente_cadastrado_apisul = Column(String, nullable=True)
    destinatario_cadastrado_apisul = Column(String, nullable=True)
    rotas_cadastradas_apisul = Column(JSON, nullable=True)  # pode ser JSON se for uma lista
    id_smp = Column(String, nullable=True)
    numero_smp = Column(String, nullable=True)
    rota_selecionada = Column(String, nullable=True)