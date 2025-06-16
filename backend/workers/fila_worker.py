import threading, queue
from database import SessionLocal
from services.processamento_cte import processar_cte

fila_processamento = queue.Queue()

def worker():
    while True:
        item = fila_processamento.get()
        if item is None:
            break
        execucao_id, dados_principal, usuario, senha = item
        db = SessionLocal()
        try:
            processar_cte(execucao_id, dados_principal, db, usuario, senha)
        finally:
            db.close()
            fila_processamento.task_done()

# Cria 2 workers (threads) que consomem a fila simultaneamente
for _ in range(3):
    threading.Thread(target=worker, daemon=True).start()
