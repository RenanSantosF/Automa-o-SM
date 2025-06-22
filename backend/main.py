from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from core.config import origins
from models import Base
from database import engine
from api import routes_status_importa_nfe, routes_upload, routes_execucoes, routes_importar_nfe, routes_auth, routes_documents
import workers.fila_worker  # inicia thread worker

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

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
app.include_router(routes_importar_nfe.router, prefix="/api")
app.include_router(routes_status_importa_nfe.router, prefix="/api")
app.include_router(routes_documents.router, prefix="/api")
app.include_router(routes_auth.router, prefix="/api")


# Define o caminho absoluto para a pasta frontend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # pasta raiz do projeto
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Monta os arquivos estáticos da pasta frontend na rota /frontend
app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

# Catch-all para rotas SPA que não sejam /api ou /frontend
@app.get("/{full_path:path}")
async def spa_catch_all(request: Request, full_path: str):
    if full_path.startswith("api") or full_path.startswith("frontend"):
        return {"detail": "API route not found or static file not found"}

    # Retorna o index.html do frontend para outras rotas
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
