# api/websocket/sm_manager.py
from typing import List
from fastapi import WebSocket

class SMConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        """Envia mensagens como TEXTO (string), igual o WebSocket de documentos."""
        for ws in self.active_connections:
            try:
                await ws.send_text(message)
            except:
                pass  # ignora conexões com erro


sm_manager = SMConnectionManager()
