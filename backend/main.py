

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import origins
from models import Base
from database import engine
from api import routes_status_importa_nfe, routes_upload, routes_execucoes, routes_importar_nfe
import workers.fila_worker  # inicia thread worker

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_upload.router)
app.include_router(routes_execucoes.router)
app.include_router(routes_importar_nfe.router)
app.include_router(routes_status_importa_nfe.router)