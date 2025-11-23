

# from fastapi import APIRouter, HTTPException
# from fastapi.responses import StreamingResponse
# import requests, base64, io, zipfile, time, os
# from utils.ajustar_peso_xml import ajustar_peso_xml   # <-- ajuste de peso

# router = APIRouter()

# API_KEY = os.getenv("MEUDANFE_API_KEY")
# BASE_URL = "https://api.meudanfe.com.br/v2/fd"


# @router.post("/nfe/download")
# def baixar_nfes(chaves: list[str]):
#     if not API_KEY:
#         raise HTTPException(status_code=500, detail="API Key não configurada no servidor.")

#     mem_zip = io.BytesIO()

#     with zipfile.ZipFile(mem_zip, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:

#         total = len(chaves)

#         for i, chave in enumerate(chaves, start=1):
#             print(f"🔹 [{i}/{total}] Processando chave: {chave}")

#             try:
#                 # ---------- ETAPA 1: Adicionar à área do cliente ----------
#                 add_url = f"{BASE_URL}/add/{chave}"
#                 add_res = requests.put(add_url, headers={"Api-Key": API_KEY})

#                 status_code = add_res.status_code
#                 content_type = add_res.headers.get("Content-Type", "")

#                 add_json = add_res.json() if content_type.startswith("application/json") else {}

#                 # ---------- Tratamento de Erros ----------
#                 if status_code == 400:
#                     msg = f"Chave inválida: {chave}"
#                     zf.writestr(f"ERRO_{chave}.txt", msg)
#                     print(f"  ❌ {msg}")
#                     continue
#                 elif status_code == 401:
#                     msg = "API Key inválida ou não informada."
#                     zf.writestr(f"ERRO_{chave}.txt", msg)
#                     print(f"  ❌ {msg}")
#                     continue
#                 elif status_code == 402:
#                     msg = f"A NFe {chave} é antiga (mais de 2 meses) e exige saldo na conta MeuDanfe."
#                     zf.writestr(f"INFO_{chave}.txt", msg)
#                     print(f"  ⚠️ {msg}")
#                     continue
#                 elif status_code == 500:
#                     msg = f"Erro interno do servidor MeuDanfe para a chave {chave}."
#                     zf.writestr(f"ERRO_{chave}.txt", msg)
#                     print(f"  ❌ {msg}")
#                     continue
#                 elif status_code != 200:
#                     msg = f"Erro desconhecido ao adicionar chave {chave}: HTTP {status_code}"
#                     zf.writestr(f"ERRO_{chave}.txt", msg)
#                     print(f"  ❌ {msg}")
#                     continue

#                 # ---------- Status ----------
#                 status = add_json.get("status", "")
#                 print(f"  → Status inicial: {status}")

#                 # ---------- Polling se WAITING/SEARCHING ----------
#                 tentativas = 0
#                 while status in ["WAITING", "SEARCHING"] and tentativas < 3:
#                     print(f"  ⏳ Aguardando processamento ({status})... Tentativa {tentativas+1}/3")
#                     time.sleep(3)
#                     check_res = requests.put(add_url, headers={"Api-Key": API_KEY})
#                     status = check_res.json().get("status", "")
#                     tentativas += 1

#                 if status not in ["OK"]:
#                     msg = f"Status final inesperado ({status}) para chave {chave}."
#                     zf.writestr(f"ERRO_{chave}.txt", msg)
#                     print(f"  ❌ {msg}")
#                     continue

#                 time.sleep(1.2)

#                 # ---------- ETAPA 2: Download do PDF ----------
#                 pdf_url = f"{BASE_URL}/get/da/{chave}"
#                 pdf_res = requests.get(pdf_url, headers={"Api-Key": API_KEY})
#                 pdf_json = pdf_res.json()

#                 if "data" not in pdf_json:
#                     msg = f"PDF não retornado para {chave}."
#                     zf.writestr(f"ERRO_{chave}.txt", msg)
#                     print(f"  ❌ {msg}")
#                     continue

#                 pdf_bytes = base64.b64decode(pdf_json["data"])

#                 # ---------- ETAPA 3: Download do XML ----------
#                 xml_url = f"{BASE_URL}/get/xml/{chave}"
#                 xml_res = requests.get(xml_url, headers={"Api-Key": API_KEY})
#                 xml_json = xml_res.json()

#                 if "data" not in xml_json:
#                     msg = f"XML não retornado para {chave}."
#                     zf.writestr(f"ERRO_{chave}.txt", msg)
#                     print(f"  ❌ {msg}")
#                     continue

#                 xml_original_str = xml_json["data"]

#                 # 🔥🔥🔥 AQUI O AJUSTE DO XML É FEITO
#                 xml_corrigido_str = ajustar_peso_xml(xml_original_str)
#                 xml_corrigido_bytes = xml_corrigido_str.encode("utf-8")

#                 # ---------- Adiciona ao ZIP ----------
#                 zf.writestr(f"{chave}.pdf", pdf_bytes)
#                 zf.writestr(f"{chave}.xml", xml_corrigido_bytes)

#                 print(f"  ✅ Sucesso: {chave}")

#             except Exception as e:
#                 msg = f"Erro inesperado ao processar chave {chave}: {str(e)}"
#                 zf.writestr(f"ERRO_{chave}.txt", msg)
#                 print(f"  ❌ {msg}")

#     mem_zip.seek(0)

#     return StreamingResponse(
#         mem_zip,
#         media_type="application/x-zip-compressed",
#         headers={"Content-Disposition": "attachment; filename=notas_fiscais.zip"}
#     )




from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import requests, base64, io, zipfile, time, os
from utils.ajustar_peso_xml import ajustar_peso_xml

router = APIRouter()

API_KEY = os.getenv("MEUDANFE_API_KEY")
BASE_URL = "https://api.meudanfe.com.br/v2/fd"


def processar_chave(chave: str):
    """Processa 1 NFe e retorna dict com pdf_bytes, xml_str ou erro."""
    try:
        # ----------------- ADD -----------------
        add_url = f"{BASE_URL}/add/{chave}"
        add_res = requests.put(add_url, headers={"Api-Key": API_KEY})

        status_code = add_res.status_code
        content_type = add_res.headers.get("Content-Type", "")

        add_json = add_res.json() if content_type.startswith("application/json") else {}

        if status_code != 200:
            return {"erro": f"Erro ao adicionar chave ({status_code})"}

        status = add_json.get("status")

        tentativas = 0
        while status in ["WAITING", "SEARCHING"] and tentativas < 3:
            time.sleep(3)
            check_res = requests.put(add_url, headers={"Api-Key": API_KEY})
            status = check_res.json().get("status")
            tentativas += 1

        if status != "OK":
            return {"erro": f"Status final inesperado ({status})"}

        time.sleep(1.2)

        # ----------------- PDF -----------------
        pdf_url = f"{BASE_URL}/get/da/{chave}"
        pdf_res = requests.get(pdf_url, headers={"Api-Key": API_KEY})
        pdf_json = pdf_res.json()

        if "data" not in pdf_json:
            return {"erro": "PDF não retornado"}

        pdf_bytes = base64.b64decode(pdf_json["data"])

        # ----------------- XML -----------------
        xml_url = f"{BASE_URL}/get/xml/{chave}"
        xml_res = requests.get(xml_url, headers={"Api-Key": API_KEY})
        xml_json = xml_res.json()

        if "data" not in xml_json:
            return {"erro": "XML não retornado"}

        xml_str = xml_json["data"]

        # Ajuste
        xml_corrigido = ajustar_peso_xml(xml_str)

        return {
            "pdf": pdf_bytes,
            "xml": xml_corrigido,
        }

    except Exception as e:
        return {"erro": str(e)}



@router.post("/nfe/download")
def baixar_nfes(
    chaves: list[str],
    modo: str = Query("zip", enum=["zip", "multi", "individual"])
):
    """
    modos:
    - zip: retorna zip com tudo
    - multi: retorna JSON com tudo sem zip
    - individual: retorna PDF + XML da primeira chave
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API Key não configurada.")

    # ======================================================
    # 1) MODO INDIVIDUAL (1 chave = 1 download por vez)
    # ======================================================
    if modo == "individual":
        chave = chaves[0]  # só 1 chave
        resultado = processar_chave(chave)

        if "erro" in resultado:
            raise HTTPException(400, resultado["erro"])

        pdf_bytes = resultado["pdf"]
        xml_bytes = resultado["xml"].encode("utf-8")

        return {
            "chave": chave,
            "pdf": base64.b64encode(pdf_bytes).decode(),
            "xml": resultado["xml"]
        }

    # ======================================================
    # 2) MODO MULTI (sem zip — retorna tudo em JSON)
    # ======================================================
    if modo == "multi":
        resposta = {"sucesso": [], "erros": []}

        for chave in chaves:
            r = processar_chave(chave)

            if "erro" in r:
                resposta["erros"].append({"chave": chave, "erro": r["erro"]})
            else:
                resposta["sucesso"].append({
                    "chave": chave,
                    "pdf": base64.b64encode(r["pdf"]).decode(),
                    "xml": r["xml"]
                })

        return resposta

    # ======================================================
    # 3) MODO ZIP (mantido igual seu original)
    # ======================================================
    mem_zip = io.BytesIO()

    with zipfile.ZipFile(mem_zip, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for chave in chaves:
            r = processar_chave(chave)

            if "erro" in r:
                zf.writestr(f"ERRO_{chave}.txt", r["erro"])
                continue

            zf.writestr(f"{chave}.pdf", r["pdf"])
            zf.writestr(f"{chave}.xml", r["xml"].encode("utf-8"))

    mem_zip.seek(0)

    return StreamingResponse(
        mem_zip,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": "attachment; filename=notas_fiscais.zip"}
    )
