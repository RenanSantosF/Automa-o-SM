from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from core.dependencies import get_db # Função para obter sessão do DB
from utils.hash import hash_password, verify_password
from utils.gerarToken import create_access_token
from schemas.payloads import UserCreate, UserOut, Token, UserUpdate
from models import User
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os
from utils.get_current_user import get_current_user

SECRET_KEY = os.getenv("SECRET_KEY")      # pega a chave secreta
ALGORITHM = os.getenv("ALGORITHM")     

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Verifica se username já existe
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username já existe")

    hashed_password = hash_password(user.senha)
    novo_usuario = User(
        username=user.username,
        senha=hashed_password,
        setor=user.setor,                  # pegue o setor enviado (não fixe "outros")
        usuario_apisul=user.usuario_apisul,  # opcional
        senha_apisul=user.senha_apisul       # opcional
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario



from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user:
        raise HTTPException(status_code=400, detail="Usuário ou senha incorretos")

    if not verify_password(form_data.password, user.senha):
        raise HTTPException(status_code=400, detail="Usuário ou senha incorretos")

    access_token = create_access_token(data={
        "sub": user.username,
        "setor": user.setor,
        "usuario_apisul": user.usuario_apisul,
        # ⚠️ Evite colocar senha, isso é inseguro.
        "senha_apisul": user.senha_apisul
    })

    return {"access_token": access_token, "token_type": "bearer"}



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")




@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_user(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Atualiza os campos se foram enviados
    if update_data.senha:
        current_user.senha = hash_password(update_data.senha)

    if update_data.setor:
        current_user.setor = update_data.setor

    if update_data.usuario_apisul is not None:
        current_user.usuario_apisul = update_data.usuario_apisul

    if update_data.senha_apisul is not None:
        current_user.senha_apisul = update_data.senha_apisul

    db.commit()
    db.refresh(current_user)

    return current_user
