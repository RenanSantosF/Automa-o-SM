
# # workers/fila_worker.py
# import threading, queue, asyncio, json
# from database import SessionLocal
# from services.processamento_cte import processar_cte
# from api.websocket.manager import manager  # -> import do manager central

# fila_processamento = queue.Queue()

# def ws_emit(tipo, mensagem):
#     # roda o broadcast de forma segura (usa asyncio.run)
#     try:
#         asyncio.run(manager.broadcast(json.dumps({"tipo": tipo, "mensagem": mensagem})))
#     except Exception:
#         # logue se quiser
#         pass


# def worker():
#     while True:
#         item = fila_processamento.get()
#         if item is None:
#             break

#         execucao_id, dados_principal, usuario, senha = item
#         db = SessionLocal()

#         ws_emit("reprocessamento", f"Execução {execucao_id} iniciou processamento.")

#         try:
#             resultado = processar_cte(execucao_id, dados_principal, db, usuario, senha)

#             # ➤ SE resultado NÃO for sucesso → Força exception
#             if not resultado or resultado is False or resultado.get("sucesso") is False:
#                 mensagem = resultado.get("erro", "Falha ao criar SMP") if isinstance(resultado, dict) else "Falha ao criar SMP"
#                 raise Exception(mensagem)

#             # Se chegou aqui → deu certo
#             ws_emit("sucesso", f"SMP da execução {execucao_id} criada com sucesso!")

#         except Exception as e:
#             ws_emit("erro", f"Erro ao processar execução {execucao_id}: {str(e)}")

#         finally:
#             db.close()
#             fila_processamento.task_done()


# threading.Thread(target=worker, daemon=True).start()


# workers/fila_worker.py
import threading, queue, asyncio, json
from database import SessionLocal
from services.processamento_cte import processar_cte
from api.websocket.manager import manager

fila_processamento = queue.Queue()


def ws_emit(tipo, mensagem):
    try:
        asyncio.run(manager.broadcast(json.dumps({
            "tipo": tipo,
            "mensagem": mensagem
        })))
    except Exception:
        pass


def worker():
    while True:
        item = fila_processamento.get()
        if item is None:
            break

        execucao_id, dados_principal, usuario, senha = item
        db = SessionLocal()

        # Extrai dados extras para usar depois
        placa = dados_principal.get("placa_cavalo", "N/A")
        condutor = dados_principal.get("condutor", "N/A")

        ws_emit(
            "atualizacao",
            f"[Início] Execução {execucao_id} iniciada. Placa: {placa}, Condutor: {condutor}"
        )

        try:
            resultado = processar_cte(execucao_id, dados_principal, db, usuario, senha)

            # TRATAMENTO PADRÃO DO RETORNO
            sucesso = False
            mensagem = "Processamento finalizado."

            if isinstance(resultado, dict):
                sucesso = resultado.get("sucesso", False)
                mensagem = (
                    resultado.get("mensagem") or
                    resultado.get("erro") or
                    mensagem
                )

            if sucesso:
                ws_emit(
                    "sucesso",
                    f"SMP criada com sucesso! "
                    f"Execução {execucao_id} | Placa: {placa} | Condutor: {condutor} | Mensagem: {mensagem}"
                )
            else:
                ws_emit(
                    "erro",
                    f"Falha na execução {execucao_id} | Placa: {placa} | Condutor: {condutor} | Detalhe: {mensagem}"
                )

        except Exception as e:
            ws_emit(
                "erro",
                f"Erro inesperado na execução {execucao_id} | Placa: {placa} | Condutor: {condutor} | Erro: {str(e)}"
            )

        finally:
            db.close()
            fila_processamento.task_done()


threading.Thread(target=worker, daemon=True).start()
