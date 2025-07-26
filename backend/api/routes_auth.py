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
from models import Document, DocumentFile, DocumentComment

SECRET_KEY = os.getenv("SECRET_KEY")      # pega a chave secreta
ALGORITHM = os.getenv("ALGORITHM")     

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    print(">>> ENTROU NO ENDPOINT /register")   # <- precisa aparecer
    print("payload recebido:", user.dict())

    # Verifica se username já existe
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username já existe")


    # Verifica se email já existe
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email já está em uso")
    
    hashed_password = hash_password(user.senha)
    print(user)
    novo_usuario = User(
        username=user.username,
        email=user.email,
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
    
    # Atualiza email se enviado (não nulo)
    if update_data.email is not None:
        # Verifica se o email já está em uso por outro usuário
        existing_email = db.query(User).filter(
            User.email == update_data.email,
            User.id != current_user.id
        ).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email já está em uso por outro usuário")
        current_user.email = update_data.email
        
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


@router.get("/usuarios", response_model=list[UserOut])
def listar_usuarios(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # ⚠️ Opcional: Verifique se o current_user tem permissão (ex: admin)
    usuarios = db.query(User).all()
    return usuarios

@router.delete("/usuarios/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_usuario(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    usuario = db.query(User).filter(User.id == user_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Deleta arquivos relacionados aos documentos do usuário
    documentos = db.query(Document).filter(Document.usuario_id == user_id).all()
    for doc in documentos:
        # Deleta arquivos do documento
        db.query(DocumentFile).filter(DocumentFile.document_id == doc.id).delete()

        # Deleta comentários do documento
        db.query(DocumentComment).filter(DocumentComment.document_id == doc.id).delete()

    # Deleta os documentos do usuário
    db.query(Document).filter(Document.usuario_id == user_id).delete()

    # Por fim, deleta o usuário
    db.delete(usuario)
    db.commit()

    return None


@router.put("/usuarios/{user_id}", response_model=UserOut)
def atualizar_usuario(user_id: int, dados: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # ⚠️ Opcional: Verifique se o current_user tem permissão (ex: admin)
    usuario = db.query(User).filter(User.id == user_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if dados.email is not None:
        email_existente = db.query(User).filter(User.email == dados.email, User.id != user_id).first()
        if email_existente:
            raise HTTPException(status_code=400, detail="Email já está em uso por outro usuário")
        usuario.email = dados.email

    if dados.senha:
        usuario.senha = hash_password(dados.senha)

    if dados.setor:
        usuario.setor = dados.setor

    if dados.usuario_apisul is not None:
        usuario.usuario_apisul = dados.usuario_apisul

    if dados.senha_apisul is not None:
        usuario.senha_apisul = dados.senha_apisul

    db.commit()
    db.refresh(usuario)

    return usuario
