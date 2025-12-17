from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Grupo(Base):
    __tablename__ = "grupos"

    id = Column(Integer, primary_key=True)
    nome = Column(String, unique=True, nullable=False)
    descricao = Column(String, nullable=True)

    permissoes = relationship(
        "Permissao",
        secondary="grupo_permissoes",
        back_populates="grupos"
    )


class Permissao(Base):
    __tablename__ = "permissoes"

    id = Column(Integer, primary_key=True)
    codigo = Column(String, unique=True, nullable=False)
    descricao = Column(String, nullable=True)

    grupos = relationship(
        "Grupo",
        secondary="grupo_permissoes",
        back_populates="permissoes"
    )


class GrupoPermissao(Base):
    __tablename__ = "grupo_permissoes"

    grupo_id = Column(Integer, ForeignKey("grupos.id"), primary_key=True)
    permissao_id = Column(Integer, ForeignKey("permissoes.id"), primary_key=True)
