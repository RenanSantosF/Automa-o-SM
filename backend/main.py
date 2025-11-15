
# from fastapi import FastAPI, Request, WebSocket
# from fastapi.middleware.cors import CORSMiddleware
# from core.config import origins
# from models import Base
# from database import engine
# from api import routes_gestor_cargas, routes_upload, routes_execucoes, routes_auth, routes_documents
# import workers.fila_worker  # inicia thread worker
# from api import routes_knowledge
# from api import routes_nfe_download

# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# import os

# # 🔥 IMPORTAÇÃO DO WEBSOCKET MANAGER
# from api.websocket.ws_manager import ws_manager

# Base.metadata.create_all(bind=engine)

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Rotas API
# app.include_router(routes_upload.router, prefix="/api")
# app.include_router(routes_execucoes.router, prefix="/api")
# app.include_router(routes_nfe_download.router, prefix="/api")
# app.include_router(routes_documents.router, prefix="/api")
# app.include_router(routes_auth.router, prefix="/api")
# app.include_router(routes_gestor_cargas.router, prefix="/api")
# app.include_router(routes_knowledge.router, prefix="/api")
# app.mount("/static", StaticFiles(directory="uploads"), name="static")

# # Diretórios do frontend
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

# # ---------------------------------------------------------
# # 🔥 ROTA WEBSOCKET — ESSENCIAL PARA NOTIFICAÇÕES
# # ---------------------------------------------------------
# @app.websocket("/api/ws/notificacoes")
# async def websocket_notificacoes(websocket: WebSocket):
#     print("📥 Conexão WS SMP recebida!")
#     await sm_manager.connect(websocket)

#     try:
#         # loop infinito igual ao WS que funciona
#         while True:
#             await asyncio.sleep(30)
#     except:
#         print("🔌 WS SMP desconectado")
#         sm_manager.disconnect(websocket)


# # ---------------------------------------------------------
# # SPA Catch-all
# # ---------------------------------------------------------
# @app.get("/{full_path:path}")
# async def spa_catch_all(request: Request, full_path: str):
#     if full_path.startswith("api") or full_path.startswith("frontend"):
#         return {"detail": "API route not found or static file not found"}

#     return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
# main.py
from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from models import Base
from database import engine
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os, asyncio

from api import (
    routes_execucoes,
    routes_upload,
    routes_auth,
    routes_documents,
    routes_gestor_cargas,
    routes_nfe_download,
    routes_knowledge
)

# Worker
import workers.fila_worker

# WebSocket Manager — AGORA O NOVO
from api.websocket.ws_manager import sm_manager

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

# ---------------------------------------------------------
# WEBSOCKET SMP - NOVO, COMPLETO
# ---------------------------------------------------------
@app.websocket("/api/ws/notificacoes")
async def websocket_notificacoes(websocket: WebSocket):
    print("📥 WS SMP conectado!")
    await sm_manager.connect(websocket)

    try:
        while True:
            await asyncio.sleep(30)
    except:
        print("🔌 WS SMP desconectado")
        sm_manager.disconnect(websocket)


# SPA Catch-all
@app.get("/{full_path:path}")
async def spa_catch_all(request: Request, full_path: str):
    if full_path.startswith("api") or full_path.startswith("frontend"):
        return {"detail": "API route not found or static file not found"}

    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
