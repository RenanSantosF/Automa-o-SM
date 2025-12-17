from sqlalchemy import Numeric, Column,Boolean, ForeignKey, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.sql import func
from database import Base  # ou como você estiver importando sua base declarativa
from sqlalchemy.orm import relationship
from sqlalchemy import Date
from models_gerais.permissoes import Grupo

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


# models.py
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    setor = Column(String, nullable=False)

    # NOVOS CAMPOS
    nome = Column(String, nullable=True)               # Nome completo do usuário
    transportadora = Column(String, nullable=True)     # Ex: Dellmar, Braspress, etc
    filial = Column(String, nullable=True)             # Ex: Pindamonhangaba, Viana...

    usuario_apisul = Column(String, nullable=True)
    senha_apisul = Column(String, nullable=True)
    
    knowledge_entries = relationship("Knowledge", back_populates="author")
    grupo_id = Column(Integer, ForeignKey("grupos.id"))
    grupo = relationship("Grupo")

    @property
    def permissoes(self):
        if not self.grupo:
            return []
        return [p.codigo for p in self.grupo.permissoes]

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


# Gestão de cargas

class Carga(Base):
    __tablename__ = "cargas"

    id = Column(Integer, primary_key=True, index=True)
    data_carregamento = Column(Date, nullable=False)
    uf_origem = Column(String(2), nullable=False)
    cidade_origem = Column(String, nullable=False)
    uf_destino = Column(String(2), nullable=False)
    cidade_destino = Column(String, nullable=False)
    rota = Column(String, nullable=False)
    valor_frete = Column(Numeric(10, 2), nullable=False)
    status = Column(String, default="normal")
    observacao_cliente = Column(String, nullable=True)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    # ---------- NOVOS CAMPOS PARA RASTREABILIDADE (AGORA NULLABLE) ----------
    criado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    criado_por = relationship("User", foreign_keys=[criado_por_id])

    criado_por_nome = Column(String, nullable=True, index=True)
    criado_por_transportadora = Column(String, nullable=True, index=True)
    criado_por_filial = Column(String, nullable=True, index=True)

    criado_por_meta = Column(JSON, nullable=True)

    # Relacionamentos com cascade
    ocorrencias = relationship(
        "OcorrenciaCarga",
        back_populates="carga",
        cascade="all, delete-orphan"
    )





class TipoOcorrencia(Base):
    __tablename__ = "tipos_ocorrencia"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)  # ex: Recusa de carga, No show, Atraso na apresentação
    descricao = Column(String, nullable=True)

    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    motivos = relationship("MotivoOcorrencia", back_populates="tipo")


class MotivoOcorrencia(Base):
    __tablename__ = "motivos_ocorrencia"

    id = Column(Integer, primary_key=True, index=True)
    tipo_id = Column(Integer, ForeignKey("tipos_ocorrencia.id"), nullable=False)
    nome = Column(String, nullable=False)  # ex: "Falha mecânica", "Alto custo operacional"
    responsabilidade_cliente = Column(Boolean, default=False)

    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    tipo = relationship("TipoOcorrencia", back_populates="motivos")
    ocorrencias = relationship("OcorrenciaCarga", back_populates="motivo")


class OcorrenciaCarga(Base):
    __tablename__ = "ocorrencias_carga"

    id = Column(Integer, primary_key=True, index=True)
    carga_id = Column(Integer, ForeignKey("cargas.id"), nullable=False)
    motivo_id = Column(Integer, ForeignKey("motivos_ocorrencia.id"), nullable=False)
    observacao = Column(String, nullable=True)
    criado_em = Column(DateTime, default=func.now())
    atualizado_em = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    carga = relationship("Carga", back_populates="ocorrencias")
    motivo = relationship("MotivoOcorrencia", back_populates="ocorrencias")
