import json
from threading import Lock

_lock = Lock()
STATUS_PATH = "status_scraping.json"

def salvar_status(chave_atual: str, atual: int, total: int, status: str):
    with _lock:
        with open(STATUS_PATH, "w", encoding="utf-8") as f:
            json.dump({
                "chave": chave_atual,
                "atual": atual,
                "total": total,
                "status": status
            }, f, ensure_ascii=False, indent=2)


def obter_status():
    try:
        with _lock:
            with open(STATUS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except FileNotFoundError:
        return {
            "chave": "",
            "atual": 0,
            "total": 0,
            "status": "Aguardando início do processo."
        }
    except Exception as e:
        return {
            "chave": "",
            "atual": 0,
            "total": 0,
            "status": f"Erro ao ler status: {str(e)}"
        }
