from sqlalchemy import Column,Boolean, ForeignKey, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.sql import func
from database import Base  # ou como você estiver importando sua base declarativa
from sqlalchemy.orm import relationship
from sqlalchemy import Date
class Execucao(Base):
    __tablename__ = "execucoes"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="Solicitação em andamento")  # pendente, sucesso, erro
    resultado = Column(Text, nullable=True)
    historico = Column(JSON, nullable=True, default=[])
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






class CTe(Base):
    __tablename__ = "ctes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    xml = Column(Text, nullable=False)

    solicitacao_id = Column(String, nullable=False)  # 🔥 Novo campo para agrupar solicitações

    notas = relationship("NFe", back_populates="cte", cascade="all, delete-orphan")


class NFe(Base):
    __tablename__ = "nfes"

    id = Column(Integer, primary_key=True, index=True)
    chave = Column(String, index=True, nullable=False)
    cte_id = Column(Integer, ForeignKey("ctes.id"), nullable=False)
    baixado = Column(Boolean, default=False)

    # 🔥 Novo campo de status
    status = Column(String, default="processando")  
    # Valores possíveis: 'processando', 'sucesso', 'erro'

    # 🔥 Novo campo de histórico (array de strings)
    historico = Column(JSON, default=[])

    # 🔗 Relacionamento
    cte = relationship("CTe", back_populates="notas")


# models.py
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)   # NOVO
    senha = Column(String, nullable=False)                            # hash
    setor = Column(String, nullable=False)

    usuario_apisul = Column(String, nullable=True)
    senha_apisul = Column(String, nullable=True)



class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    nome = Column(String, nullable=False)
    placa = Column(String, nullable=False)
    cliente     = Column(String, nullable=False)     
    visualizado_por = Column(JSON, default=[])
    data_do_malote = Column(Date, nullable=False)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
  
  
    manifesto_baixado = Column(Boolean, default=False)  


    status = Column(String, default="enviado")

    usuario = relationship("User")
    arquivos = relationship("DocumentFile", back_populates="document", order_by="DocumentFile.criado_em")
    comentarios_rel = relationship("DocumentComment", back_populates="document")




class DocumentFile(Base):
    __tablename__ = "document_files"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    nome_arquivo = Column(String, nullable=False)
    caminho_arquivo = Column(String, nullable=False)
    criado_em = Column(DateTime, default=func.now())

    usuario_id = Column(Integer, ForeignKey("users.id"))
    usuario = relationship("User")

    document = relationship("Document", back_populates="arquivos")

    visualizado_por = Column(JSON, default=[])  # <--- ADICIONE ESTA LINHA


class DocumentComment(Base):
    __tablename__ = "document_comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    usuario_id = Column(Integer, ForeignKey("users.id"))
    texto = Column(String, nullable=False)
    criado_em = Column(DateTime, default=func.now())

    # NOVO: Lista de IDs dos usuários que já visualizaram
    visualizado_por = Column(JSON, default=[])  # lista de user_ids

    document = relationship("Document", back_populates="comentarios_rel")
    usuario = relationship("User")
