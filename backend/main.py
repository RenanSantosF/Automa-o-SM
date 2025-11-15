

from fastapi import FastAPI, Request, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
from models import Base
from database import engine
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os, asyncio
from jose import jwt, JWTError

from api.websocket.manager import manager        # ✔ único manager global
from core.config import SECRET_KEY, ALGORITHM    # ✔ usa mesma chave

from api import (
    routes_execucoes,
    routes_upload,
    routes_auth,
    routes_documents,
    routes_gestor_cargas,
    routes_nfe_download,
    routes_knowledge
)

import workers.fila_worker

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas API
app.include_router(routes_upload.router, prefix="/api")
app.include_router(routes_execucoes.router, prefix="/api")
app.include_router(routes_auth.router, prefix="/api")
app.include_router(routes_documents.router, prefix="/api")
app.include_router(routes_gestor_cargas.router, prefix="/api")
app.include_router(routes_nfe_download.router, prefix="/api")
app.include_router(routes_knowledge.router, prefix="/api")


# Arquivos estáticos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")
app.mount("/static", StaticFiles(directory="uploads"), name="static")


@app.websocket("/api/ws/notificacoes")
async def websocket_notificacoes(websocket: WebSocket):
    print("🔔 Tentando conectar WS notificações...")

    token = websocket.query_params.get("token")
    if not token:
        print("❌ WS notificações sem token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except JWTError:
        print("❌ Token inválido no WS notificações")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    print(f"🟢 WS notificações conectado: {username}")
    await manager.connect(websocket)

    try:
        while True:
            await asyncio.sleep(30)
    except:
        print(f"🔌 WS notificações desconectado: {username}")
        manager.disconnect(websocket)
