

import threading, queue, asyncio, json
from database import SessionLocal
from services.processamento_cte import processar_cte
from api.websocket.manager import manager
from models import Execucao   # IMPORTANTE: certifique-se que o caminho está correto

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

        placa = dados_principal.get("placa_cavalo", "N/A")
        condutor = dados_principal.get("condutor", "N/A")

        ws_emit(
            "atualizacao",
            f"[Início] Execução {execucao_id} iniciada. Placa: {placa}, Condutor: {condutor}"
        )

        try:
            # Executa o processamento — retorno é irrelevante agora
            processar_cte(execucao_id, dados_principal, db, usuario, senha)

            # 🔥 RECARREGA A EXECUÇÃO DO BANCO (fonte da verdade)
            execucao_db = db.query(Execucao).filter_by(id=execucao_id).first()

            if not execucao_db:
                ws_emit(
                    "erro",
                    f"Execução {execucao_id} não encontrada no banco após o processamento."
                )
                continue

            # 🔥 Lê status e resultado armazenado no banco
            status = execucao_db.status.lower().strip()
            mensagem = execucao_db.resultado or "Processamento finalizado."

            if status == "sucesso":
                ws_emit(
                    "sucesso",
                    f"SMP criada com sucesso! "
                    f"Execução {execucao_id} | Placa: {placa} | Condutor: {condutor}"
                )
            else:
                ws_emit(
                    "erro",
                    f"Falha na execução {execucao_id} | Placa: {placa} | Condutor: {condutor}"
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

