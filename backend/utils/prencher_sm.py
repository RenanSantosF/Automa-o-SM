
import re
import time
from typing import Any, Dict, Optional, List

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    StaleElementReferenceException,
    NoSuchElementException,
    ElementNotInteractableException,
)
import traceback

from utils.calcula_distancia import calcular_data_entrega
from utils.exceptions import ReiniciarProcessoException


def formatar_cnpj(cnpj_str: str) -> str:
    cnpj_digits = ''.join(filter(str.isdigit, cnpj_str or ""))
    if len(cnpj_digits) != 14:
        raise ValueError(f"CNPJ inválido: {cnpj_str}")
    return f"{cnpj_digits[:2]}.{cnpj_digits[2:5]}.{cnpj_digits[5:8]}/{cnpj_digits[8:12]}-{cnpj_digits[12:]}"


def _wait(driver, timeout=15):
    return WebDriverWait(driver, timeout)


def safe_find(driver, by, valor, timeout=10, clickable=False):
    """Find element with wait and return element or raise TimeoutException."""
    wait = _wait(driver, timeout)
    if clickable:
        return wait.until(EC.element_to_be_clickable((by, valor)))
    else:
        return wait.until(EC.presence_of_element_located((by, valor)))


def safe_click(driver, by, valor, timeout=10, retries=3, scroll=True, delay_between=0.7):
    """Robust click with retries; uses JS click fallback if needed."""
    last_exc = None
    for attempt in range(retries):
        try:
            el = safe_find(driver, by, valor, timeout=timeout, clickable=True)
            if scroll:
                try:
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", el)
                    time.sleep(0.2)
                except Exception:
                    pass
            try:
                el.click()
            except ElementNotInteractableException:
                driver.execute_script("arguments[0].click();", el)
            return el
        except Exception as e:
            last_exc = e
            time.sleep(delay_between)
    raise Exception(f"Falha ao clicar em {valor}: {last_exc}")


def send_keys_with_wait(driver, element, text: str, wait_after=0.2):
    element.clear()
    element.send_keys(text)
    time.sleep(wait_after)


def select_autocomplete_from_input(driver, input_id: str, text: str, wait_selector="ul.rcbList li.rcbTemplate"):
    """
    Preenche um autocomplete (mesmo input usado para remetente/destinatário),
    espera as opções e seleciona via DOWN+ENTER. Retorna o valor final do input.
    """
    input_el = safe_find(driver, By.ID, input_id, timeout=15)
    send_keys_with_wait(driver, input_el, text, wait_after=0.3)

    try:
        # espera opção aparecer
        _wait(driver, 12).until(EC.element_to_be_clickable((By.CSS_SELECTOR, wait_selector)))
    except TimeoutException:
        raise Exception(f"Nenhuma sugestão apareceu para '{text}' no input {input_id}.")

    input_el.send_keys(Keys.DOWN)
    input_el.send_keys(Keys.ENTER)
    time.sleep(0.8)
    # reobtém valor final
    input_el = driver.find_element(By.ID, input_id)
    final_value = input_el.get_attribute("value") or ""
    if not final_value.strip():
        raise Exception(f"Valor não selecionado corretamente para '{text}'.")
    return final_value.strip()


def format_valor_string(valor_str: str) -> str:
    """Formata string numérica para padrão com vírgula (ex: '1234.5' -> '1.234,50')."""
    if not valor_str:
        return "0,00"
    # aceita tanto ',' quanto '.' como separador decimal
    normalized = valor_str.replace(".", "").replace(",", ".") if valor_str.count(",") <= 1 else valor_str.replace(".", "")
    try:
        v = float(normalized)
    except Exception:
        # fallback: extrai dígitos e assume centavos 2 casas
        digits = re.sub(r"[^\d]", "", valor_str)
        if not digits:
            v = 0.0
        else:
            v = int(digits) / 100.0
    # formatando com separador de milhar e decimal com vírgula
    s = f"{v:,.2f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def preencher_sm(driver, dados: Dict[str, Any]):
    driver.get("https://novoapisullog.apisul.com.br/SMP/0")

    # espera carregamento inicial (um elemento condicional confiável)
    try:
        _wait(driver, 20).until(
            EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente"))
        )
    except Exception as e:
        print("Erro ao carregar a página (espera inicial):", e)

    # ---------- VINCULAR REMETENTE ----------
    try:
        print("Vinculando ponto de origem")
        safe_click(driver, By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
        safe_find(driver, By.ID, "rcbIdentificadorPonto_Input", timeout=20)

        cnpj_formatado = formatar_cnpj(dados["remetente_cnpj"])
        remetente_nome = select_autocomplete_from_input(driver, "rcbIdentificadorPonto_Input", cnpj_formatado)
        dados["remetente_cadastrado_apisul"] = remetente_nome
        print("Remetente cadastrado:", remetente_nome)

        botao_salvar = safe_find(driver, By.NAME, "ctl00$MainContent$gridPontosVinculados$ctl00$ctl02$ctl02$btnSalvarPontoSMP", timeout=10)
        try:
            botao_salvar.click()
        except Exception:
            driver.execute_script("arguments[0].click();", botao_salvar)

    except StaleElementReferenceException as e:
        print("StaleElementReference ao preencher remetente:", e)
        raise ReiniciarProcessoException("Erro ao preencher remetente, reiniciar processo") from e
    except TimeoutException as e:
        print("Timeout ao preencher remetente:", e)
        raise ReiniciarProcessoException("Timeout ao preencher remetente") from e
    except Exception:
        raise

    # ---------- VINCULAR DESTINATÁRIO ----------
    try:
        # espera a grid atualizar
        safe_find(driver, By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00__0", timeout=15)
        # tenta clicar para vincular ponto destino (mesmo id)
        print("Vinculando ponto de destino")
        safe_click(driver, By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")

        cnpj_formatado = formatar_cnpj(dados["destinatario_cnpj"])
        destinatario_nome = select_autocomplete_from_input(driver, "rcbIdentificadorPonto_Input", cnpj_formatado)
        dados["destinatario_cadastrado_apisul"] = destinatario_nome
        print("Destinatário cadastrado:", destinatario_nome)

        # tempo de permanência
        tempo_el = safe_find(driver, By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtTempoPermanencia_dateInput", timeout=8)
        send_keys_with_wait(driver, tempo_el, "1100", wait_after=0.3)

    except TimeoutException as e:
        print("Erro/timeout ao preencher destino:", e)
        raise ReiniciarProcessoException("Erro desconhecido ao preencher destino") from e
    except Exception:
        raise

    def selecionar_tipo_ponto(driver, texto="ENTREGA", timeout=15):
        # Campo invisível / readonly / protegido → não digitar
        print("Abrindo combobox de Tipo do Ponto...")

        # 1) clica no INPUT para abrir a lista
        campo = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.ID, "cmbTipoPontoSMP_Input"))
        )

        try:
            campo.click()
        except:
            driver.execute_script("arguments[0].click();", campo)

        time.sleep(0.4)

        # 2) espera o dropdown aparecer
        xpath_opcao = f"//li[contains(@class,'rcbItem') and contains(text(), '{texto}')]"

        opcao = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.XPATH, xpath_opcao))
        )

        print(f"Selecionando opção '{texto}'...")

        # 3) clica na opção
        try:
            opcao.click()
        except:
            driver.execute_script("arguments[0].click();", opcao)

        time.sleep(0.3)

        print(f"✔ Tipo do ponto selecionado: {texto}")


    # ---------- DATA ESTIMADA ----------
    try:
        print("Inserindo data estimada")
        data_formatada = calcular_data_entrega(dados["local_origem"], dados["local_destino"])
        campo_data = safe_find(driver, By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtPrevisaoChegada_dateInput", timeout=15)
        try:
            campo_data.click()
        except Exception:
            driver.execute_script("arguments[0].click();", campo_data)
        time.sleep(0.5)
        send_keys_with_wait(driver, campo_data, data_formatada, wait_after=0.5)
        campo_data.send_keys(Keys.TAB)
    except Exception as e:
        # observe que agora levantamos uma mensagem de erro com detalhe
        raise Exception(f"Erro ao preencher campo de data estimada: {e}") from e

    # ---------- TIPO DO PONTO E SALVAR DESTINATÁRIO ----------
    # ---------- TIPO DO PONTO E SALVAR DESTINATÁRIO ----------
    try:
        print("Tipo do ponto -> ENTREGA")
        selecionar_tipo_ponto(driver, "ENTREGA")
    except Exception as e:
        raise Exception(f"Erro ao preencher o campo tipo do ponto: {e}") from e

    try:
        print("Salvando destinatário")
        botao_salvar_dest = safe_find(
            driver,
            By.ID,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_btnSalvarPontoSMP",
            timeout=10
        )
        try:
            botao_salvar_dest.click()
        except:
            driver.execute_script("arguments[0].click();", botao_salvar_dest)
    except Exception as e:
        raise Exception(f"Erro ao salvar o destinatário: {e}") from e
    


    # ===== Função robusta para selecionar itens Telerik =====
    def selecionar_item_telerik(driver, input_id, texto_alvo, timeout=15):
        """
        Seleciona um item em um RadComboBox do Telerik de forma robusta.
        - clica/abre o combo
        - tenta full match, partial, itera itens, e por fim tenta setar via JS e disparar eventos
        Logs detalhados para debug.
        """
        print(f"[Telerik] Iniciando seleção '{texto_alvo}' no {input_id}")
        try:
            # localizar input (presença) e garantir visibilidade
            campo = WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.ID, input_id))
            )
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", campo)
            time.sleep(0.15)

            # se input for readOnly (telerik costuma ser), clicar na seta também
            try:
                campo.click()
            except Exception as e:
                # tentar clicar via JS
                print(f"[Telerik] click direto falhou ({e}); clicando via JS")
                driver.execute_script("arguments[0].click();", campo)
            time.sleep(0.35)

            # aguardar que a lista apareça (se houver um dropdown container)
            # XPath genérico para itens do RadComboBox
            xpath_items = "//li[contains(@class,'rcbItem')]"

            # 1) full match (normalize-space pra evitar espaços estranhos)
            xpath_full = f"//li[contains(@class,'rcbItem') and contains(normalize-space(.), \"{texto_alvo}\")]"
            try:
                opcao = WebDriverWait(driver, 2).until(
                    EC.element_to_be_clickable((By.XPATH, xpath_full))
                )
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", opcao)
                opcao.click()
                time.sleep(0.25)
                print(f"[Telerik] ✔ Selecionado (full match): {texto_alvo}")
                return
            except Exception:
                print("[Telerik] full match não encontrada, tentando partial...")

            # 2) partial match (prefix/substring)
            texto_parcial = texto_alvo[:6]
            xpath_partial = f"//li[contains(@class,'rcbItem') and contains(normalize-space(.), \"{texto_parcial}\")]"
            try:
                opcao = WebDriverWait(driver, 2).until(
                    EC.element_to_be_clickable((By.XPATH, xpath_partial))
                )
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", opcao)
                opcao.click()
                time.sleep(0.25)
                print(f"[Telerik] ✔ Selecionado (partial match): {texto_parcial}")
                return
            except Exception:
                print("[Telerik] partial match não encontrada, tentando iterar itens...")

            # 3) iterar todos os itens visíveis e clicar na correspondência
            itens = driver.find_elements(By.XPATH, xpath_items)
            for item in itens:
                try:
                    txt = (item.text or "").strip()
                    if not txt:
                        continue
                    if texto_alvo.upper() in txt.upper() or texto_parcial.upper() in txt.upper():
                        try:
                            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", item)
                            item.click()
                            time.sleep(0.25)
                            print(f"[Telerik] ✔ Selecionado (iterando itens): {txt}")
                            return
                        except Exception as e:
                            print(f"[Telerik] tentativa de clicar item via click() falhou ({e}), tentando JS click")
                            try:
                                driver.execute_script("arguments[0].click();", item)
                                time.sleep(0.25)
                                print(f"[Telerik] ✔ Selecionado (JS click): {txt}")
                                return
                            except Exception as e2:
                                print(f"[Telerik] JS click também falhou: {e2}")
                                continue
                except StaleElementReferenceException:
                    print("[Telerik] Item stale durante iteração; ignorando e continuando")
                    continue

            # 4) Fallback: setar diretamente o value do input e disparar eventos
            try:
                # tenta setar o texto no input e disparar eventos de change/blur
                js_set = (
                    "var inp = document.getElementById(arguments[0]);"
                    "if(inp){ inp.value = arguments[1]; inp.dispatchEvent(new Event('input',{bubbles:true}));"
                    "inp.dispatchEvent(new Event('change',{bubbles:true})); inp.dispatchEvent(new Event('blur')); return true;} return false;"
                )
                ok = driver.execute_script(js_set, input_id, texto_alvo)
                time.sleep(0.35)
                if ok:
                    print("[Telerik] Valor setado via JS no input; aguardando que o Telerik aceite o valor")
                    # após set, tentar dar ENTER no input
                    try:
                        campo = driver.find_element(By.ID, input_id)
                        campo.send_keys(Keys.ENTER)
                        time.sleep(0.35)
                        # verificar se alguma opção foi realmente selecionada (procura token ou valor input diferente)
                        atual = campo.get_attribute('value') or ''
                        print(f"[Telerik] valor atual do input depois do set: '{atual}'")
                        return
                    except Exception as ee:
                        print(f"[Telerik] erro ao dar ENTER após set via JS: {ee}")
            except Exception as e:
                print(f"[Telerik] fallback JS set falhou: {e}")

            raise Exception(f"Não encontrei item '{texto_alvo}' no combo {input_id}")

        except Exception as exc:
            print("[Telerik] ERRO FATAL na seleção:", exc)
            traceback.print_exc()
            raise
    # ===== Bloco ADICIONAR PROJETO (completo e corrigido) =====
    time.sleep(0.5)


    # ========== ADICIONAR PROJETO — DEFINITIVO, FUNCIONANDO LOCAL/VPS HEADLESS ==========
    try:
        print("\n=== INICIANDO ADIÇÃO DO PROJETO ===")

        # ---------------------------------------------------------------------
        # AJUDA O TELERIK A CARREGAR NO HEADLESS
        # ---------------------------------------------------------------------
        def scroll_awake():
            try:
                driver.execute_script("window.scrollTo(0,0);")
                time.sleep(0.12)
                driver.execute_script("window.scrollTo(0, 400);")
                time.sleep(0.12)
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(0.15)
            except:
                pass

        # ---------------------------------------------------------------------
        # LOCALIZAR LINHA DO PONTO (A DE ÍNDICE 1)
        # ---------------------------------------------------------------------
        def localizar_linha_projeto():
            print("🔎 Verificando se a grid existe...")

            # garantir grid carregada
            WebDriverWait(driver, 12).until(
                EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00"))
            )

            scroll_awake()

            print("🔎 Verificando se existe alguma linha...")
            WebDriverWait(driver, 12).until(
                EC.presence_of_element_located((
                    By.XPATH,
                    "//table[contains(@id,'gridPontosVinculados')]//tr[contains(@id,'__')]"
                ))
            )

            time.sleep(0.4)

            # tentar ID exato (linha _1)
            try:
                print("🔎 Procurando linha index 1 (ID fixo)...")
                return driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00__1")
            except:
                print("⚠ Linha _1 não encontrada por ID, tentando fallback xpath...")

            # fallback mais tolerante
            try:
                return WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((
                        By.XPATH,
                        "//tr[contains(@id,'gridPontosVinculados') and (contains(@id,'__1') or contains(@id,'_1'))]"
                    ))
                )
            except Exception as e:
                print("❌ A LINHA 1 NÃO EXISTE AINDA! NÃO É POSSÍVEL ADICIONAR PROJETO.")
                raise Exception("A linha do ponto não foi renderizada — salvar destinatário pode não ter funcionado.")

        # ---------------------------------------------------------------------
        # EXPANDIR LINHA DO PONTO
        # ---------------------------------------------------------------------
        def expandir_linha():
            print("🔽 Expandindo linha do ponto para revelar botão de Adicionar Projeto...")

            scroll_awake()

            linha = localizar_linha_projeto()
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", linha)
            time.sleep(0.3)

            expand_btn_id = "ctl00_MainContent_gridPontosVinculados_ctl00_ctl07_GECBtnExpandColumn"

            try:
                expand_btn = driver.find_element(By.ID, expand_btn_id)
            except:
                print("❌ Botão de expandir NÃO ENCONTRADO! Pane na página.")
                raise Exception("Botão expandir não existe. O ponto não foi salvo corretamente.")

            print("✔ Botão de expandir encontrado!")

            try:
                expand_btn.click()
            except:
                print("⚠ expand_btn.click() falhou, tentando clicar via JS...")
                driver.execute_script("arguments[0].click();", expand_btn)

            time.sleep(1.0)

            # garantir que o detalhe abriu
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((
                    By.XPATH,
                    "//input[contains(@id,'InitInsertButton')]"
                ))
            )

            print("✔ Linha expandida com sucesso!")

        # ---------------------------------------------------------------------
        # TENTAR EXPANDIR (com retry)
        # ---------------------------------------------------------------------
        for tent in range(1, 4):
            try:
                expandir_linha()
                break
            except Exception as e:
                print(f"⚠ Erro ao expandir linha (tentativa {tent}): {e}")
                if tent == 3:
                    raise
                time.sleep(1)

        # ---------------------------------------------------------------------
        # CLICAR NO BOTÃO ADICIONAR PROJETO
        # ---------------------------------------------------------------------
        print("🟦 Clicando no botão ADICIONAR PROJETO")

        add_btn_id = "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl00_InitInsertButton"

        for tent in range(1, 5):
            try:
                add_btn = WebDriverWait(driver, 12).until(
                    EC.element_to_be_clickable((By.ID, add_btn_id))
                )
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", add_btn)
                time.sleep(0.25)

                try:
                    add_btn.click()
                except:
                    print("⚠ add_btn.click() falhou, usando JS")
                    driver.execute_script("arguments[0].click();", add_btn)

                # esperar o campo carregar
                WebDriverWait(driver, 8).until(
                    EC.presence_of_element_located((By.ID,
                        "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input"))
                )

                print("✔ Botão ADICIONAR PROJETO funcionou")
                break

            except Exception as e:
                print(f"⚠ Falha ao clicar em adicionar projeto (tentativa {tent}): {e}")
                if tent == 4:
                    raise
                time.sleep(1)

        # ---------------------------------------------------------------------
        # PREENCHER TIPO DO PROJETO
        # ---------------------------------------------------------------------
        print("🟦 Selecionando TIPO DE PROJETO")
        selecionar_item_telerik(
            driver,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input",
            "DELLMAR - ESPECIFICAS"
        )

        # ---------------------------------------------------------------------
        # PREENCHER TIPO DE CARGA
        # ---------------------------------------------------------------------
        print("🟦 Selecionando TIPO DE CARGA")
        selecionar_item_telerik(
            driver,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbTipoCarga_Input",
            "DIVERSOS"
        )

        # ---------------------------------------------------------------------
        # VALOR CARGA
        # ---------------------------------------------------------------------
        print("🟦 Preenchendo VALOR DA CARGA")

        campo_valor = safe_find(
            driver,
            By.ID,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rntxtValorCarga",
            timeout=10
        )

        valor_formatado = format_valor_string(dados.get("valor_total_carga", "0") or "0")

        try:
            campo_valor.clear()
        except:
            driver.execute_script("arguments[0].value='';", campo_valor)

        send_keys_with_wait(driver, campo_valor, valor_formatado)
        campo_valor.send_keys(Keys.TAB)
        time.sleep(0.4)

        # ---------------------------------------------------------------------
        # SALVAR PROJETO
        # ---------------------------------------------------------------------
        print("🟦 Salvando PROJETO")

        salvar_id = "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_btnSalvarProjeto"

        btn_salvar = WebDriverWait(driver, 12).until(
            EC.element_to_be_clickable((By.ID, salvar_id))
        )

        try:
            btn_salvar.click()
        except:
            driver.execute_script("arguments[0].click();", btn_salvar)

        time.sleep(1.4)
        print("✔ Projeto SALVO com sucesso!\n")

    except Exception as e:
        print("❌ ERRO AO ADICIONAR PROJETO:", e)
        traceback.print_exc()
        raise Exception(f"Erro ao adicionar projeto: {e}")


    # ---------- TRANSPORTADORA / TIPO OPERAÇÃO / HORÁRIO ----------
    try:
        print("Selecionando transportadora...")
        selecionar_item_telerik(
            driver,
            input_id="ctl00_MainContent_txtEmitenteTransportadora_Input",
            texto_alvo="DELLMAR TRANSPORTES"
        )

        print("Selecionando tipo de operação...")
        selecionar_item_telerik(
            driver,
            input_id="ctl00_MainContent_cmbTipoOperacao_Input",
            texto_alvo="TRANSFERÊNCIA"   # parte do texto já resolve
        )

        print("Clicando no botão adicionar horário...")
        botao_horario = safe_find(driver, By.ID, "MainContent_btnAdicionarHorario", timeout=8)
        try:
            botao_horario.click()
        except Exception:
            driver.execute_script("arguments[0].click();", botao_horario)

        time.sleep(1.5)

    except Exception as e:
        raise Exception(f"Erro ao preencher transportadora/tipo operação/horário: {e}") from e

    # ---------- PLACAS (robusto, tenta variações) ----------
    print("Preenchimento de placas iniciado")

    NUMERO_PARA_LETRA = {'0': 'A', '1': 'B', '2': 'C', '3': 'D', '4': 'E', '5': 'F', '6': 'G', '7': 'H', '8': 'I', '9': 'J'}
    LETRA_PARA_NUMERO = {v: k for k, v in NUMERO_PARA_LETRA.items()}

    def gerar_variacoes_placa(placa: str) -> List[str]:
        placa = (placa or "").strip().upper()
        if len(placa) != 7:
            return []
        base = placa
        char5 = placa[4]
        variacoes = []
        if char5.isalpha() and char5 in LETRA_PARA_NUMERO:
            variacoes.append(base[:4] + LETRA_PARA_NUMERO[char5] + base[5:])
        if char5.isdigit() and char5 in NUMERO_PARA_LETRA:
            variacoes.append(base[:4] + NUMERO_PARA_LETRA[char5] + base[5:])
        # dedupe preservando ordem
        seen = set(); out = []
        for v in [base] + variacoes:
            if v not in seen:
                out.append(v); seen.add(v)
        return out

    def tentar_preencher_placa_local(placa_texto: str, max_tentativas=3):
        if not placa_texto or not placa_texto.strip():
            return
        variacoes = gerar_variacoes_placa(placa_texto)
        if not variacoes:
            variacoes = [placa_texto.strip().upper()]

        for variacao in variacoes:
            for tentativa in range(1, max_tentativas + 1):
                try:
                    campo = safe_find(driver, By.ID, "txtVeiculo_Input", timeout=8)
                    # limpar com pequenos waits (às vezes autocomplete fica preso)
                    try:
                        campo.clear()
                    except Exception:
                        driver.execute_script("arguments[0].value = '';", campo)
                    time.sleep(0.4)

                    send_keys_with_wait(driver, campo, variacao, wait_after=0.3)

                    # espera lista de sugestões do componente RadAutoComplete (if present)
                    try:
                        _wait(driver, 10).until(
                            lambda d: any(
                                ul.is_displayed() and ul.find_elements(By.TAG_NAME, "li")
                                for ul in d.find_elements(By.CSS_SELECTOR, "div.RadAutoCompleteBoxPopup ul.racList")
                            )
                        )
                    except TimeoutException:
                        # não necessariamente é fatal — ainda tentamos TAB e checar tokens
                        pass

                    campo.send_keys(Keys.TAB)
                    # espera token indicando aceitação
                    _wait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "span.racTextToken")))
                    spans = driver.find_elements(By.CSS_SELECTOR, "span.racTextToken")
                    placas_encontradas = [s.text.strip().upper() for s in spans if s.text.strip()]
                    if any(p.startswith(variacao) for p in placas_encontradas):
                        # confirmar vinculo
                        btn_confirm = safe_find(driver, By.ID, "ctl00_MainContent_btnVinculoVeiculo", timeout=6)
                        try:
                            btn_confirm.click()
                        except Exception:
                            driver.execute_script("arguments[0].click();", btn_confirm)
                        # espera linha apareça na grade de veículos
                        _wait(driver, 10).until(EC.presence_of_element_located((By.ID, "ctl00_MainContent_grdViewVeiculo_ctl00__0")))
                        print(f"Placa {variacao} vinculada com sucesso.")
                        return
                    else:
                        raise Exception("Placa não reconhecida nos tokens.")
                except Exception as e:
                    print(f"Tentativa {tentativa} para '{variacao}' falhou: {e}")
                    time.sleep(0.8)
            print(f"Todas tentativas falharam para variação '{variacao}'")
        raise Exception(f"Nenhuma variação da placa '{placa_texto}' foi aceita.")

    try:
        tentar_preencher_placa_local(dados.get("placa_cavalo", ""))
        if dados.get("placa_carreta_1"):
            tentar_preencher_placa_local(dados.get("placa_carreta_1"))
        if dados.get("placa_carreta_2"):
            tentar_preencher_placa_local(dados.get("placa_carreta_2"))
    except Exception as e:
        raise Exception(f"Erro ao preencher placas: {e}") from e

    time.sleep(1.0)

    # ---------- ROTA ----------
    try:
        print("Escolhendo rota")

        # Seleciona tipo de rota (cliente)
        safe_click(driver, By.ID, "MainContent_rblTipoRota_1")
        time.sleep(0.4)

        botao_rota_cliente = safe_find(driver, By.ID, "MainContent_rblRotaExistente_0", timeout=8)
        try:
            botao_rota_cliente.click()
        except:
            driver.execute_script("arguments[0].click();", botao_rota_cliente)
        time.sleep(0.5)

        # Função anti-stale para abrir o combo sempre do zero
        def abrir_combo_rota():
            campo = safe_find(driver, By.ID, "ctl00_MainContent_rcbRota_Input", timeout=12)
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", campo)
            try:
                campo.click()
            except:
                driver.execute_script("arguments[0].click();", campo)
            return campo

        # Retry anti-stale
        for tentativa in range(1, 4):
            try:
                print(f"Tentando abrir rota (tentativa {tentativa})...")
                campo_rota = abrir_combo_rota()

                # Espera a lista realmente existir (Telerik recria o DOM)
                _wait(driver, 10).until(
                    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "ul.rcbList li"))
                )
                time.sleep(0.5)

                itens = driver.find_elements(By.CSS_SELECTOR, "ul.rcbList li")
                rotas_disponiveis = [r.text.strip() for r in itens if r.text.strip()]

                if not rotas_disponiveis:
                    raise Exception("Nenhuma rota disponível encontrada após AJAX.")

                # Seleciona a primeira rota
                primeira_rota = itens[0]
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", primeira_rota)

                try:
                    primeira_rota.click()
                except:
                    driver.execute_script("arguments[0].click();", primeira_rota)

                time.sleep(1)

                rota_selecionada = safe_find(driver, By.ID, "ctl00_MainContent_rcbRota_Input").get_attribute("value")

                if rota_selecionada:
                    print("✔ Rota selecionada:", rota_selecionada)
                    dados["rota_selecionada"] = rota_selecionada
                    dados["rotas_cadastradas_apisul"] = rotas_disponiveis
                    break
                else:
                    raise Exception("Rota não retornou valor após seleção.")

            except StaleElementReferenceException:
                print("⚠ Elemento stale — recarregando combo...")
                time.sleep(0.8)
                continue

            except Exception as e:
                if tentativa == 3:
                    raise Exception(f"Falha ao selecionar rota: {e}") from e
                print(f"⚠ Erro ao selecionar rota (tentativa {tentativa}): {e}")
                time.sleep(0.8)
                continue

    except Exception as e:
        raise Exception(f"Erro ao selecionar rota: {e}") from e
    
    
    
    
    
    
    # ---------- MOTORISTA ----------
    try:
        print("Incluindo motorista")
        safe_click(driver, By.ID, "ctl00_MainContent_btnVinculaMotorista")
        time.sleep(1.0)

        print("Aguardando modal...")
        modal = _wait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "ctl00_MainContent_modalPopupMotorista_C"))
        )
        print("✔ Modal aberto")

        # # ---------------- TIPO DOC: selecionar CPF ----------------
        # print("Selecionando tipo de documento (CPF)...")
        # arrow = safe_find(driver, By.ID, "ctl00_MainContent_modalPopupMotorista_C_tipoDeDocumento_rcbTipoDocumento_Arrow", timeout=10)

        # try:
        #     arrow.click()
        # except:
        #     driver.execute_script("arguments[0].click();", arrow)

        # # espera lista abrir
        # opcao_cpf = _wait(driver, 10).until(
        #     EC.element_to_be_clickable((By.XPATH, "//li[contains(@class,'rcbItem')][.//label[text()='CPF']]"))
        # )

        # try:
        #     opcao_cpf.click()
        # except:
        #     driver.execute_script("arguments[0].click();", opcao_cpf)

        # print("✔ CPF selecionado")

        # ---------------- DOCUMENTO (INPUT NORMAL) ----------------
        cpf_input = safe_find(
            driver,
            By.ID,
            "ctl00_MainContent_modalPopupMotorista_C_tipoDeDocumento_txtDocumento",
            timeout=10
        )
        cpf_input.clear()
        time.sleep(0.1)
        cpf_input.send_keys(dados["cpf_condutor"])
        time.sleep(0.3)

        # ---------------- PESQUISAR ----------------
        btn_pesquisar = safe_find(driver, By.ID, "ctl00_MainContent_modalPopupMotorista_C_btnPesquisarMotorista", timeout=10)
        try:
            btn_pesquisar.click()
        except:
            driver.execute_script("arguments[0].click();", btn_pesquisar)

        # ---------------- VINCULAR MOTORISTA ----------------
        add_btn = _wait(driver, 10).until(
            EC.element_to_be_clickable((
                By.ID,
                "ctl00_MainContent_modalPopupMotorista_C_grdViewMotoristaConsulta_ctl00_ctl04_btnSalvarMotoristaPrevia"
            ))
        )

        add_btn.click()

        # Aguarda aparecer na grade de prévia
        _wait(driver, 10).until(
            EC.presence_of_element_located((
                By.ID,
                "ctl00_MainContent_modalPopupMotorista_C_grdViewMotoristaPrevia_ctl00__0"
            ))
        )

        # Confirmar
        btn_confirma = safe_find(driver, By.ID, "ctl00_MainContent_modalPopupMotorista_C_btnSalvarMotorista", timeout=10)
        try:
            btn_confirma.click()
        except:
            driver.execute_script("arguments[0].click();", btn_confirma)

        print("✔ Motorista incluído com sucesso!")
        time.sleep(1.2)

    except Exception as e:
        raise Exception(f"Erro ao inserir o condutor: {e}") from e







    # ---------- SALVAR SMP e Aguardar número ----------
    def extrair_numero_smp_de_texto(texto: str) -> Optional[str]:
        if not texto:
            return None
        # Tenta extrair com regex "número 12345" ou "número: 12345" ou apenas dígitos
        m = re.search(r"n[aú]mero[:\s]*([0-9]+)", texto, flags=re.IGNORECASE)
        if m:
            return m.group(1)
        m2 = re.search(r"\b([0-9]{4,10})\b", texto)
        if m2:
            return m2.group(1)
        return None

    try:
        # CLICA PRA SALVAR SMP
        safe_click(driver, By.ID, "ctl00_MainContent_btnNovo", timeout=12)
        timeout_total = 40
        start = time.time()
        sm_numero = None
        notificacao_antes = ""
        try:
            notificacao_antes = driver.find_element(By.ID, "notifTexto").text.strip()
        except Exception:
            notificacao_antes = ""

        erro_detectado = False
        notificacao_texto = None

        while time.time() - start < timeout_total:
            time.sleep(0.4)
            # 1) label SMP
            try:
                sm_label = driver.find_element(By.ID, "ctl00_MainContent_lblNumeroSM")
                if sm_label.is_displayed() and sm_label.text.strip():
                    sm_numero = sm_label.text.strip()
                    dados["numero_smp"] = sm_numero
                    break
            except Exception:
                pass

            # 2) toast / notificacao
            try:
                div_not = driver.find_element(By.ID, "divNotificacao")
                if div_not.is_displayed():
                    notif_text = driver.find_element(By.ID, "notifTexto").text.strip()
                    if notif_text and notif_text != notificacao_antes:
                        print("Notificação:", notif_text)
                        notificacao_texto = notif_text
                        try:
                            driver.find_element(By.ID, "btnCloseNotificacao").click()
                        except Exception:
                            pass
                        if "foi salva com sucesso" in notif_text.lower() or "salva com sucesso" in notif_text.lower():
                            num = extrair_numero_smp_de_texto(notif_text)
                            if num:
                                sm_numero = num
                                dados["numero_smp"] = sm_numero
                                break
                            else:
                                print("Notificação positiva, mas não consegui extrair número.")
                        else:
                            erro_detectado = True
                            break
            except Exception:
                pass

            # 3) alertas radalert
            try:
                alertas = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radalert")
                for alerta in alertas:
                    if alerta.is_displayed():
                        texto = alerta.text.strip()
                        print("Alerta:", texto)
                        try:
                            ok_btn = alerta.find_element(By.CLASS_NAME, "rwPopupButton")
                            ok_btn.click()
                        except Exception:
                            pass
                        if any(w in texto.lower() for w in ["erro", "não foi possível", "falha"]):
                            erro_detectado = True
                            notificacao_texto = texto
                        break
            except Exception:
                pass

            # 4) confirmações radconfirm
            try:
                confirms = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radconfirm")
                for conf in confirms:
                    if conf.is_displayed():
                        txt = conf.text.strip()
                        print("Confirmação:", txt)
                        try:
                            ok_btns = conf.find_elements(By.CLASS_NAME, "rwPopupButton")
                            for b in ok_btns:
                                if "OK" in b.text.upper() or "SIM" in b.text.upper():
                                    b.click()
                                    break
                        except Exception:
                            pass
                        break
            except Exception:
                pass

        if sm_numero:
            print("SMP criada:", sm_numero)
        else:
            if erro_detectado:
                raise Exception(f"Erro ao salvar SMP: {notificacao_texto or 'erro não especificado'}")
            else:
                raise Exception("Timeout ao aguardar resposta de salvar SMP.")
    except Exception as e:
        raise
