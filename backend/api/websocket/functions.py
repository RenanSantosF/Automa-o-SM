import json
from fastapi.encoders import jsonable_encoder
from app.websocket_manager import manager

async def notificar_documento_atualizado(doc):
    """
    Envia o documento inteiro atualizado para todos os clientes WS.
    """
    payload = {
        "tipo": "documento_atualizado",
        "documento": jsonable_encoder(doc)
    }
    await manager.broadcast(json.dumps(payload))
