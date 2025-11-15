# api/routes_ws.py
from fastapi import APIRouter, WebSocket
import asyncio
from api.websocket.manager import manager

router = APIRouter()

@router.websocket("/ws/notificacoes")
async def websocket_notificacoes(websocket: WebSocket):
    print("📥 Cliente conectado ao WS de notificações")
    await manager.connect(websocket)

    try:
        while True:
            await asyncio.sleep(30)
    except:
        print("🔌 Cliente desconectado do WS")
        manager.disconnect(websocket)
