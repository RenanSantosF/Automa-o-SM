# import json
# from sqlalchemy.orm import Session
# from utils.login import login_apisul
# from utils.prencher_sm import preencher_sm
# from crud import atualizar_status

# def processar_cte(execucao_id: int, dados_principal: dict, db: Session, usuario: str, senha: str):
#     driver = None
#     sm_numero = None
#     try:
#         atualizar_status(db, execucao_id, status="Solicitação em andamento")
#         driver = login_apisul(usuario, senha)
#         preencher_sm(driver, dados_principal)

#         remetente = dados_principal.get("remetente_cadastrado_apisul")
#         destinatario = dados_principal.get("destinatario_cadastrado_apisul")
#         rotas = dados_principal.get("rotas_cadastradas_apisul")
#         rota_atual = dados_principal.get("rota_selecionada")
#         sm_numero = dados_principal.get("numero_smp")

#         atualizar_status(
#             db, execucao_id, status="Sucesso",
#             resultado=json.dumps(dados_principal),
#             remetente_cadastrado_apisul=remetente,
#             destinatario_cadastrado_apisul=destinatario,
#             rotas_cadastradas_apisul=rotas,
#             rota_selecionada=rota_atual,
#             numero_smp=sm_numero
#         )


#     except Exception as e:
#         atualizar_status(
#             db, execucao_id, status="Erro",
#             resultado=json.dumps(dados_principal),
#             erro=str(e),
#             remetente_cadastrado_apisul=dados_principal.get("remetente_cadastrado_apisul"),
#             destinatario_cadastrado_apisul=dados_principal.get("destinatario_cadastrado_apisul"),
#             rotas_cadastradas_apisul=dados_principal.get("rotas_cadastradas_apisul"),
#             rota_selecionada=dados_principal.get("rota_selecionada"),
#             numero_smp=sm_numero
#         )

#     finally:
#         if driver:
#             driver.quit()


import json
from sqlalchemy.orm import Session
from utils.login import login_apisul
from utils.prencher_sm import preencher_sm
from crud import atualizar_status

def processar_cte(execucao_id: int, dados_principal: dict, db: Session, usuario: str, senha: str):
    max_tentativas = 3
    tentativa = 0
    sm_numero = None

    while tentativa < max_tentativas:
        tentativa += 1
        driver = None
        try:
            print(f"[INFO] Tentativa {tentativa} de preenchimento da SMP")

            atualizar_status(db, execucao_id, status="Solicitação em andamento")
            driver = login_apisul(usuario, senha)

            resultado = preencher_sm(driver, dados_principal)
            if resultado == "__REINICIAR__":
                print("[WARNING] preencher_sm solicitou reinício")
                continue  # volta para o topo do while para tentar novamente

            remetente = dados_principal.get("remetente_cadastrado_apisul")
            destinatario = dados_principal.get("destinatario_cadastrado_apisul")
            rotas = dados_principal.get("rotas_cadastradas_apisul")
            rota_atual = dados_principal.get("rota_selecionada")
            sm_numero = dados_principal.get("numero_smp")

            atualizar_status(
                db, execucao_id, status="Sucesso",
                resultado=json.dumps(dados_principal),
                remetente_cadastrado_apisul=remetente,
                destinatario_cadastrado_apisul=destinatario,
                rotas_cadastradas_apisul=rotas,
                rota_selecionada=rota_atual,
                numero_smp=sm_numero
            )
            break  # sucesso, encerra o while

        except Exception as e:
            print(f"[ERRO] Tentativa {tentativa} falhou: {e}")
            if tentativa == max_tentativas:
                atualizar_status(
                    db, execucao_id, status="Erro",
                    resultado=json.dumps(dados_principal),
                    erro=str(e),
                    remetente_cadastrado_apisul=dados_principal.get("remetente_cadastrado_apisul"),
                    destinatario_cadastrado_apisul=dados_principal.get("destinatario_cadastrado_apisul"),
                    rotas_cadastradas_apisul=dados_principal.get("rotas_cadastradas_apisul"),
                    rota_selecionada=dados_principal.get("rota_selecionada"),
                    numero_smp=sm_numero
                )
        finally:
            if driver:
                driver.quit()
