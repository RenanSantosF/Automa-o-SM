

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from core.config import origins
from models import Base
from database import engine
from api import routes_status_importa_nfe, routes_upload, routes_execucoes, routes_importar_nfe
import workers.fila_worker  # inicia thread worker

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
Base.metadata.create_all(bind=engine)

# seu código de importação e setup aqui...

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# suas rotas API
app.include_router(routes_upload.router, prefix="/api")
app.include_router(routes_execucoes.router, prefix="/api")
app.include_router(routes_importar_nfe.router, prefix="/api")
app.include_router(routes_status_importa_nfe.router, prefix="/api")


# Monta o frontend numa rota específica
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

@app.get("/{full_path:path}")
async def spa_catch_all(request: Request, full_path: str):
    # Se for rota API, passa para FastAPI tratar normalmente (retorna 404 se não achar)
    if full_path.startswith("api") or full_path.startswith("frontend"):
        return {"detail": "API route not found or static file not found"}

    # Serve o index.html para todas as outras rotas
    return FileResponse(os.path.join("frontend", "index.html"))