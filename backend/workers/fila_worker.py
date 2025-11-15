# import threading, queue
# from database import SessionLocal
# from services.processamento_cte import processar_cte

# fila_processamento = queue.Queue()

# def worker():
#     while True:
#         item = fila_processamento.get()
#         if item is None:
#             break
#         execucao_id, dados_principal, usuario, senha = item
#         db = SessionLocal()
#         try:
#             processar_cte(execucao_id, dados_principal, db, usuario, senha)
#         finally:
#             db.close()
#             fila_processamento.task_done()

# threading.Thread(target=worker, daemon=True).start()


import threading, queue, asyncio
from database import SessionLocal
from services.processamento_cte import processar_cte
from api.websocket.ws_manager import sm_manager

fila_processamento = queue.Queue()

def ws_emit(tipo, mensagem):
    """Envia WS mesmo dentro de threads."""
    try:
        asyncio.run(sm_manager.broadcast({"tipo": tipo, "mensagem": mensagem}))
    except:
        pass




def worker():
    while True:
        item = fila_processamento.get()
        if item is None:
            break

        execucao_id, dados_principal, usuario, senha = item
        db = SessionLocal()

        ws_emit("reprocessamento", f"Execução {execucao_id} iniciou processamento.")

        try:
            # roda o processamento original
            processar_cte(execucao_id, dados_principal, db, usuario, senha)

            # 🔎 depois do processamento, reconsulta a execução
            from crud import buscar_execucao_por_id
            execucao_atual = buscar_execucao_por_id(db, execucao_id)

            if execucao_atual.status.lower() == "erro":
                ws_emit("erro", f"Erro ao processar execução {execucao_id}.")
            else:
                ws_emit("sucesso", f"SMP da execução {execucao_id} criada com sucesso!")

        except Exception as e:
            ws_emit("erro", f"Erro crítico ao processar execução {execucao_id}: {str(e)}")

        finally:
            db.close()
            fila_processamento.task_done()




threading.Thread(target=worker, daemon=True).start()
