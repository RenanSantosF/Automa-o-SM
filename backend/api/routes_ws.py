# backend/api/routes_ws.py
import asyncio
from fastapi import APIRouter, WebSocket, status
from jose import jwt, JWTError
from core.config import SECRET_KEY, ALGORITHM   # ajustar se suas constantes estiverem em outro lugar
from api.websocket.manager import manager

router = APIRouter()

@router.websocket("/ws/notificacoes")
async def websocket_notificacoes(websocket: WebSocket):
    """
    Rota WS que será montada em /api/ws/notificacoes (porque vamos incluir router com prefix /api).
    Exige token via query param (igual ao WS de documentos).
    Usa o mesmo `manager` que o WS de documentos.
    """
    token = websocket.query_params.get("token")
    if not token:
        print("❌ WS notificacoes sem token — recusando")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise JWTError()
    except JWTError:
        print("❌ Token inválido no WS notificacoes")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    print(f"🟢 WS notificacoes conectado: {username}")
    await manager.connect(websocket)

    try:
        while True:
            await asyncio.sleep(30)   # keepalive loop, igual ao WS que funciona
    except Exception:
        print(f"🔌 WS notificacoes desconectado: {username}")
        manager.disconnect(websocket)
