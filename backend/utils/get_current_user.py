from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from jose import jwt, JWTError
from core.dependencies import get_db
from models import User
from models_gerais.permissoes import Grupo
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY", "sua_chave_secreta_aqui")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = (
        db.query(User)
        .options(
            joinedload(User.grupo).joinedload(Grupo.permissoes)
        )
        .filter(User.username == username)
        .first()
    )

    if user is None:
        raise credentials_exception

    return user
