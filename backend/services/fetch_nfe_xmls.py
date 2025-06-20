

import os
import asyncio
import httpx
from models import NFe
from utils.email import enviar_email_com_anexos
from sqlalchemy.orm import Session
from typing import List


async def buscar_e_enviar_nfes(
    db: Session,
    chaves: List[str],
    email_destino: str,
    email_copia: str = None,
    pasta_temporaria: str = "temp_xmls"
):
    os.makedirs(pasta_temporaria, exist_ok=True)

    nfes = db.query(NFe).filter(
        NFe.chave.in_(chaves),
        NFe.baixado == False
    ).all()

    if not nfes:
        print("Nenhuma NFe nova para processar.")
        return

    arquivos = []

    HEADERS = {
        "Content-Type": "text/plain; charset=UTF-8",
        "Origin": "https://meudanfe.com.br",
        "Referer": "https://meudanfe.com.br/",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/137.0.0.0 Safari/537.36"
        ),
        "Accept": "*/*",
    }

    MAX_TENTATIVAS = 5

    async with httpx.AsyncClient(timeout=30) as client:

        async def post_com_retry(url: str) -> httpx.Response:
            for tentativa in range(MAX_TENTATIVAS):
                resp = await client.post(url, headers=HEADERS, content="{}")
                if resp.status_code == 400:
                    print(f"[ERRO] Bad Request (400) para {url}, tentativa {tentativa + 1}/{MAX_TENTATIVAS}")
                    await asyncio.sleep(2 ** tentativa)
                else:
                    resp.raise_for_status()
                    return resp
            raise Exception(f"Falha definitiva após {MAX_TENTATIVAS} tentativas em {url}")

        for idx, nfe in enumerate(nfes, start=1):
            chave = nfe.chave.strip()
            if len(chave) != 44:
                msg = f"[AVISO] Chave inválida (tamanho errado): {chave}"
                print(msg)
                nfe.status = "erro"
                nfe.historico.append(msg)
                db.commit()
                continue

            try:
                print(f"[INFO] Processando {idx}/{len(nfes)}: {chave}")

                # Atualiza status para processando
                nfe.status = "processando"
                nfe.historico.append("🚀 Iniciando processamento da NFe.")
                db.commit()

                url_consulta = f"https://ws.meudanfe.com/api/v1/get/nfe/data/MEUDANFE/{chave}"
                url_xml = f"https://ws.meudanfe.com/api/v1/get/nfe/xml/{chave}"

                resp_consulta = await post_com_retry(url_consulta)
                await asyncio.sleep(2)  # Delay leve para não sobrecarregar

                resp_xml = await post_com_retry(url_xml)

                nome_arquivo = f"{chave}.xml"
                caminho = os.path.join(pasta_temporaria, nome_arquivo)
                with open(caminho, "w", encoding="utf-8") as f:
                    f.write(resp_xml.text)

                arquivos.append(caminho)

                # ✅ Marca como baixado e sucesso
                nfe.baixado = True
                nfe.status = "sucesso"
                nfe.historico.append("✅ NFe baixada e salva com sucesso.")
                db.commit()

                if len(arquivos) >= 10:
                    enviar_email_com_anexos(email_destino, arquivos, cc=email_copia)
                    for arquivo in arquivos:
                        try:
                            os.remove(arquivo)
                        except Exception as e:
                            print(f"[ERRO] Falha ao remover arquivo {arquivo}: {e}")
                    arquivos.clear()

            except Exception as e:
                erro_msg = f"❌ Erro ao processar chave {chave}: {str(e)}"
                print(erro_msg)
                nfe.status = "erro"
                nfe.historico.append(erro_msg)
                db.commit()

            await asyncio.sleep(3)  # Delay leve entre NFes

    if arquivos:
        enviar_email_com_anexos(email_destino, arquivos, cc=email_copia)
        for arquivo in arquivos:
            try:
                os.remove(arquivo)
            except Exception as e:
                print(f"[ERRO] Falha ao remover arquivo {arquivo}: {e}")

    print("✅ Processo finalizado.")
