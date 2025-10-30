

import json
from sqlalchemy.orm import Session
from utils.login import login_apisul
from utils.prencher_sm import preencher_sm
from utils.exceptions import ReiniciarProcessoException
from crud import atualizar_status

def atualizar_status_sucesso(db, execucao_id, dados_principal):
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

def atualizar_status_erro(db, execucao_id, dados_principal, erro, sm_numero):
    atualizar_status(
        db, execucao_id, status="Erro",
        resultado=json.dumps(dados_principal),
        erro=str(erro),
        remetente_cadastrado_apisul=dados_principal.get("remetente_cadastrado_apisul"),
        destinatario_cadastrado_apisul=dados_principal.get("destinatario_cadastrado_apisul"),
        rotas_cadastradas_apisul=dados_principal.get("rotas_cadastradas_apisul"),
        rota_selecionada=dados_principal.get("rota_selecionada"),
        numero_smp=sm_numero
    )

def processar_cte(execucao_id: int, dados_principal: dict, db: Session, usuario: str, senha: str):
    max_tentativas = 3
    sm_numero = None

    for tentativa in range(1, max_tentativas + 1):
        driver = None
        try:
            print(f"[INFO] Tentativa {tentativa} de preenchimento da SMP")
            atualizar_status(db, execucao_id, status="Solicitação em andamento")
            driver = login_apisul(usuario, senha)

            preencher_sm(driver, dados_principal)

            atualizar_status_sucesso(db, execucao_id, dados_principal)
            break  # sucesso, sai do loop

        except ReiniciarProcessoException as e:
            print(f"[WARNING] Erro reiniciável na tentativa {tentativa}: {e}")
            # driver será fechado no finally antes de próxima tentativa
            if driver:
                driver.quit()
            if tentativa == max_tentativas:
                atualizar_status_erro(db, execucao_id, dados_principal, e, sm_numero)
            continue  # tenta novamente

        except Exception as e:
            print(f"[ERRO] Erro fatal na tentativa {tentativa}: {e}")
            atualizar_status_erro(db, execucao_id, dados_principal, e, sm_numero)
            break  # erro fatal, não tenta mais

        finally:
            if driver:
                driver.quit()
