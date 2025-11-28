
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






    # ---------- VINCULAR DESTINATÁRIO (SIMPLES, IGUAL AO REMETENTE) ----------
    try:
        print("Vinculando ponto de destino")

        # Aguarda linha 0 renderizada
        safe_find(driver, By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00__0", timeout=15)

        # Abre o modal de ponto existente
        safe_click(driver, By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")

        # Autocomplete do CNPJ
        cnpj_formatado = formatar_cnpj(dados["destinatario_cnpj"])
        destinatario_nome = select_autocomplete_from_input(
            driver,
            "rcbIdentificadorPonto_Input",
            cnpj_formatado
        )
        dados["destinatario_cadastrado_apisul"] = destinatario_nome
        print("Destinatário cadastrado:", destinatario_nome)

        # Preencher tempo de permanência (igual ao remetente)
        tempo_el = safe_find(
            driver,
            By.ID,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtTempoPermanencia_dateInput",
            timeout=10
        )
        try:
            tempo_el.click()
        except:
            driver.execute_script("arguments[0].click();", tempo_el)

        time.sleep(0.2)
        tempo_el.clear()
        send_keys_with_wait(driver, tempo_el, "1100", wait_after=0.2)
        tempo_el.send_keys(Keys.TAB)

    except Exception as e:
        raise Exception(f"Erro ao preencher dados do destinatário: {e}") from e



    # ---------- SELECIONAR TIPO DO PONTO ----------
    def selecionar_tipo_ponto(driver, texto="ENTREGA", timeout=10):
        print(f"Selecionando Tipo do Ponto: {texto}")

        campo = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.ID, "cmbTipoPontoSMP_Input"))
        )

        try:
            campo.click()
        except:
            driver.execute_script("arguments[0].click();", campo)

        time.sleep(0.3)

        xpath = f"//li[contains(@class,'rcbItem') and contains(text(), '{texto}')]"
        opcao = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.XPATH, xpath))
        )

        try:
            opcao.click()
        except:
            driver.execute_script("arguments[0].click();", opcao)

        time.sleep(0.2)
        print("✔ Tipo do ponto selecionado:", texto)



    # ---------- DEFINIR TIPO DO PONTO (ANTES DE SALVAR) ----------
    try:
        selecionar_tipo_ponto(driver, "ENTREGA")
    except Exception as e:
        raise Exception(f"Falha ao selecionar o tipo do ponto: {e}") from e


    # ---------- DATA ESTIMADA (VERSÃO ROBUSTA PARA VPS/HEADLESS) ----------
    def preencher_data_estimada(driver, data_texto, timeout=10):
        campo_id = "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtPrevisaoChegada_dateInput"

        for tentativa in range(1, 4):
            try:
                print(f"Inserindo data estimada (tentativa {tentativa})")

                campo = safe_find(driver, By.ID, campo_id, timeout=timeout)

                # 1) clicar no campo
                try:
                    campo.click()
                except:
                    driver.execute_script("arguments[0].click();", campo)

                time.sleep(0.3)

                # 2) limpar de verdade
                driver.execute_script("arguments[0].value = '';", campo)
                time.sleep(0.2)

                # 3) preencher via JS (mais confiável no Telerik headless)
                driver.execute_script("""
                    var el = arguments[0];
                    el.value = arguments[1];
                    el.dispatchEvent(new Event('input', {bubbles:true}));
                    el.dispatchEvent(new Event('change', {bubbles:true}));
                    el.dispatchEvent(new Event('blur', {bubbles:true}));
                """, campo, data_texto)

                time.sleep(0.3)

                # 4) forçar TAB para o Telerik validar
                campo.send_keys(Keys.TAB)
                time.sleep(0.4)

                # 5) verificar se realmente está preenchido
                valor_final = driver.execute_script("return document.getElementById(arguments[0]).value;", campo_id)
                print("Valor final da data:", valor_final)

                if valor_final and len(valor_final) >= 8:
                    print("✔ Data estimada preenchida com sucesso!")
                    return

                print("⚠ Campo não aceitou, tentando novamente...")

            except Exception as e:
                print(f"Erro ao preencher data (tent {tentativa}): {e}")

        raise Exception("Falha ao preencher data estimada — campo permanece vazio.")


    # Chamada:
    try:
        print("Inserindo data estimada")
        data_formatada = calcular_data_entrega(
            dados["local_origem"], dados["local_destino"]
        )
        preencher_data_estimada(driver, data_formatada)

    except Exception as e:
        raise Exception(f"Erro ao preencher data estimada: {e}") from e


    # ---------- VALIDAÇÃO ANTES DE SALVAR DESTINATÁRIO ----------
    print("\n🔎 Validando campos obrigatórios antes de salvar destinatário...")

    campos_obrigatorios = {
        "cnpj_destinatario": "rcbIdentificadorPonto_Input",
        "tempo_permanencia": "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtTempoPermanencia_dateInput",
        "tipo_ponto": "cmbTipoPontoSMP_Input",
        "data_chegada": "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtPrevisaoChegada_dateInput"
    }

    campos_invalidos = []

    for nome_log, campo_id in campos_obrigatorios.items():
        try:
            valor = driver.execute_script("""
                var el = document.getElementById(arguments[0]);
                if (!el) return null;
                return el.value || el.textContent || el.innerText || '';
            """, campo_id)

            valor = (valor or "").strip()

            print(f"    • {nome_log}: '{valor}'")

            if not valor:
                campos_invalidos.append(nome_log)

        except Exception as e:
            print(f"    • ERRO ao ler '{nome_log}': {e}")
            campos_invalidos.append(nome_log)

    if campos_invalidos:
        print("\n❌ ERRO: Campos obrigatórios vazios antes de salvar:")
        for c in campos_invalidos:
            print(f"   → {c}")

        raise Exception(
            f"Não foi possível salvar destinátario — campos vazios: {', '.join(campos_invalidos)}"
        )

    print("✔ Todos os campos obrigatórios estão preenchidos.")

    # ---------- SALVAR DESTINATÁRIO (VERSÃO À PROVA DE STALE) ----------
    try:
        print("Salvando destinatário")

        def obter_botao_salvar():
            return WebDriverWait(driver, 10).until(
                EC.presence_of_element_located(
                    (By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_btnSalvarPontoSMP")
                )
            )

        for tentativa in range(1, 4):
            try:
                botao_salvar = obter_botao_salvar()

                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", botao_salvar)
                time.sleep(0.2)

                try:
                    botao_salvar.click()
                except:
                    driver.execute_script("arguments[0].click();", botao_salvar)

                # Aguardar linha __1 OU alteração de DOM
                try:
                    safe_find(driver,
                        By.ID,
                        "ctl00_MainContent_gridPontosVinculados_ctl00__1",
                        timeout=6
                    )
                    print("✔ Destinatário salvo — linha __1 criada")
                    break

                except Exception:
                    print(f"⚠ DOM não atualizou ainda (tentativa {tentativa}), aguardando...")
                    time.sleep(0.8)
                    continue

            except Exception as e:
                print(f"⚠ Stale ao clicar em salvar (tentativa {tentativa}): {e}")
                time.sleep(0.5)

        else:
            raise Exception("Não foi possível salvar o destinatário após 3 tentativas.")

    except Exception as e:
        raise Exception(f"Erro ao salvar o destinatário: {e}") from e



    def selecionar_item_telerik(driver, input_id, texto, timeout=12):
        """
        Função segura para selecionar item em um RadComboBox
        que reconstrói o DOM (evita stale element).
        """
        print(f"[Telerik] Selecionando '{texto}' em {input_id}")

        for tentativa in range(1, 4):
            try:
                # Re-localiza SEMPRE o campo
                campo = WebDriverWait(driver, timeout).until(
                    EC.presence_of_element_located((By.ID, input_id))
                )

                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", campo)
                time.sleep(0.2)

                try:
                    campo.click()
                except:
                    driver.execute_script("arguments[0].click();", campo)

                time.sleep(0.3)

                # Localiza item por texto
                xpath = f"//li[contains(@class,'rcbItem') and contains(., '{texto}')]"

                opcao = WebDriverWait(driver, timeout).until(
                    EC.element_to_be_clickable((By.XPATH, xpath))
                )

                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", opcao)
                time.sleep(0.2)

                try:
                    opcao.click()
                except:
                    driver.execute_script("arguments[0].click();", opcao)

                time.sleep(0.2)
                print(f"[Telerik] ✔ Selecionado '{texto}'")
                return

            except StaleElementReferenceException:
                print(f"[Telerik] stale element ao selecionar '{texto}', retry {tentativa}/3")
                time.sleep(0.4)
                continue

            except Exception as e:
                print(f"[Telerik] Erro ao selecionar '{texto}' (tent {tentativa}/3): {e}")
                time.sleep(0.4)
                if tentativa == 3:
                    raise

        raise Exception(f"Não foi possível selecionar '{texto}' no combo {input_id}")












    # ========== ADICIONAR PROJETO — CORRIGIDO, SEM REFRESH, FUNCIONA LOCAL/VPS HEADLESS ==========

    try:
        print("\n=== INICIANDO ADIÇÃO DO PROJETO ===")

        # ------------------------------------------------------------
        # ESPERA INTELIGENTE DO TELERIK (AJAX)
        # ------------------------------------------------------------
        def esperar_ajax_telerik(timeout=15):
            """
            Espera o AJAX interno do Telerik terminar.
            Funciona mesmo em modo headless.
            """
            print("⏳ Aguardando AJAX Telerik finalizar...")

            end = time.time() + timeout
            while time.time() < end:
                busy = driver.execute_script("""
                    var l = document.querySelectorAll('.raDiv');
                    if (!l.length) return false;
                    return [...l].some(e => e.style.display !== 'none');
                """)
                if not busy:
                    time.sleep(0.25)
                    return
                time.sleep(0.20)

            print("⚠ Aviso: AJAX demorou mais que o esperado, continuando mesmo assim.")


        # ------------------------------------------------------------
        # ESPERA A LINHA DO PONTO SER CRIADA
        # ------------------------------------------------------------
        def esperar_linha_1(timeout=12):
            """
            Garante que a linha _1 realmente existe.
            Isso corrige o bug crítico no VPS.
            """
            print("🔎 Aguardando a linha 1 aparecer...")

            end = time.time() + timeout
            while time.time() < end:
                try:
                    # id exato
                    linha = driver.find_element(By.ID,
                        "ctl00_MainContent_gridPontosVinculados_ctl00__1"
                    )
                    if linha.is_displayed():
                        print("✔ Linha 1 encontrada!")
                        return linha
                except:
                    pass

                # fallback xpath
                try:
                    linha = driver.find_element(
                        By.XPATH,
                        "//tr[contains(@id,'gridPontosVinculados') and (contains(@id,'__1') or contains(@id,'_1'))]"
                    )
                    if linha.is_displayed():
                        print("✔ Linha 1 encontrada (fallback XPath)!")
                        return linha
                except:
                    pass

                time.sleep(0.35)

            raise Exception("A linha 1 do ponto NÃO apareceu — o salvamento não concluiu a tempo.")


        # ------------------------------------------------------------
        # SCROLL DESPERTADOR HEADLESS
        # ------------------------------------------------------------
        def scroll_awake():
            try:
                driver.execute_script("window.scrollTo(0,0);")
                time.sleep(0.10)
                driver.execute_script("window.scrollTo(0, 300);")
                time.sleep(0.10)
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(0.15)
            except:
                pass


        # ------------------------------------------------------------
        # EXPANDIR LINHA
        # ------------------------------------------------------------
        def expandir_linha():
            print("🔽 Expandindo linha do ponto...")

            scroll_awake()
            esperar_ajax_telerik()        # <--- garante render
            linha = esperar_linha_1()     # <--- garante existência real

            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", linha)
            time.sleep(0.25)

            expand_id = "ctl00_MainContent_gridPontosVinculados_ctl00_ctl07_GECBtnExpandColumn"

            try:
                btn = driver.find_element(By.ID, expand_id)
            except:
                raise Exception("Botão de expandir não existe — ponto não foi salvo.")

            try:
                btn.click()
            except:
                driver.execute_script("arguments[0].click();", btn)

            esperar_ajax_telerik()
            time.sleep(0.6)

            print("✔ Linha expandida")


        # RETRY PARA EXPANDIR
        for t in range(1, 4):
            try:
                expandir_linha()
                break
            except Exception as e:
                print(f"⚠ Tentativa {t} de expandir falhou: {e}")
                if t == 3:
                    raise
                time.sleep(1)


        # ------------------------------------------------------------
        # CLICAR ADICIONAR PROJETO
        # ------------------------------------------------------------
        print("🟦 Clicando no botão ADICIONAR PROJETO...")

        add_btn_id = "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl00_InitInsertButton"

        for t in range(1, 5):
            try:
                add_btn = WebDriverWait(driver, 12).until(
                    EC.element_to_be_clickable((By.ID, add_btn_id))
                )
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", add_btn)
                time.sleep(0.25)

                try:
                    add_btn.click()
                except:
                    driver.execute_script("arguments[0].click();", add_btn)

                esperar_ajax_telerik()

                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.ID,
                        "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input"
                    ))
                )

                print("✔ Botão ADICIONAR PROJETO funcionou")
                break

            except Exception as e:
                print(f"⚠ falha ao clicar em adicionar projeto (tent {t}): {e}")
                if t == 4:
                    raise
                time.sleep(1)


        # ------------------------------------------------------------
        # TIPO PROJETO
        # ------------------------------------------------------------
        print("🟦 Selecionando TIPO DE PROJETO")
        selecionar_item_telerik(
            driver,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input",
            "DELLMAR - ESPECIFICAS"
        )

        # ------------------------------------------------------------
        # TIPO CARGA
        # ------------------------------------------------------------
        print("🟦 Selecionando TIPO DE CARGA")
        selecionar_item_telerik(
            driver,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbTipoCarga_Input",
            "DIVERSOS"
        )
        
        # ------------------------------------------------------------
        # VALOR CARGA
        # ------------------------------------------------------------
        print("🟦 Preenchendo VALOR DA CARGA")

        def float_to_br(valor):
            """
            Converte 296914.28 -> '296.914,28'
            Aceita float, int ou string numérica.
            """
            try:
                valor_float = float(str(valor).replace(",", "."))
            except:
                return str(valor)
            valor_br = f"{valor_float:,.2f}"
            valor_br = valor_br.replace(",", "X").replace(".", ",").replace("X", ".")
            return valor_br

        campo_valor = safe_find(
            driver,
            By.ID,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rntxtValorCarga",
            timeout=10
        )

        # pega o valor bruto e converte para BR
        valor_bruto = dados.get("valor_total_carga", "")
        valor_convertido = float_to_br(valor_bruto)

        print("valor da carga convertido:", valor_convertido)

        # limpa campo (com fallback via JS)
        try:
            campo_valor.clear()
        except:
            driver.execute_script("arguments[0].value='';", campo_valor)

        # envia no formato que o Telerik aceita
        campo_valor.send_keys(valor_convertido)

        # deixa o Telerik formatar automaticamente
        campo_valor.send_keys(Keys.TAB)

        time.sleep(0.4)


        # ------------------------------------------------------------
        # SALVAR PROJETO
        # ------------------------------------------------------------
        print("🟦 Salvando PROJETO")

        salvar_id = "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_btnSalvarProjeto"

        btn_salvar = WebDriverWait(driver, 12).until(
            EC.element_to_be_clickable((By.ID, salvar_id))
        )

        try:
            btn_salvar.click()
        except:
            driver.execute_script("arguments[0].click();", btn_salvar)

        esperar_ajax_telerik()
        time.sleep(0.8)

        print("✔ Projeto SALVO com sucesso!\n")

    except Exception as e:
        print("❌ ERRO AO ADICIONAR PROJETO:", e)
        traceback.print_exc()
        raise Exception(f"Erro ao adicionar projeto: {e}")

















    time.sleep(2)

    # ---------- TRANSPORTADORA / TIPO OPERAÇÃO / HORÁRIO ----------
    try:
        print("Selecionando transportadora...")
        selecionar_item_telerik(
            driver,
            "ctl00_MainContent_txtEmitenteTransportadora_Input",
            "DELLMAR TRANSPORTES"
        )

        print("Selecionando tipo de operação...")
        selecionar_item_telerik(
            driver,
            "ctl00_MainContent_cmbTipoOperacao_Input",
            "TRANSFERÊNCIA"   # parte do texto já resolve
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

                    try:
                        campo.clear()
                    except Exception:
                        driver.execute_script("arguments[0].value = '';", campo)
                    time.sleep(0.4)

                    send_keys_with_wait(driver, campo, variacao, wait_after=0.3)

                    try:
                        _wait(driver, 10).until(
                            lambda d: any(
                                ul.is_displayed() and ul.find_elements(By.TAG_NAME, "li")
                                for ul in d.find_elements(By.CSS_SELECTOR, "div.RadAutoCompleteBoxPopup ul.racList")
                            )
                        )
                    except TimeoutException:
                        pass

                    campo.send_keys(Keys.TAB)

                    _wait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "span.racTextToken"))
                    )

                    spans = driver.find_elements(By.CSS_SELECTOR, "span.racTextToken")
                    placas_encontradas = [s.text.strip().upper() for s in spans if s.text.strip()]
                    if any(p.startswith(variacao) for p in placas_encontradas):
                        btn_confirm = safe_find(driver, By.ID, "ctl00_MainContent_btnVinculoVeiculo", timeout=6)
                        try:
                            btn_confirm.click()
                        except Exception:
                            driver.execute_script("arguments[0].click();", btn_confirm)

                        _wait(driver, 10).until(
                            EC.presence_of_element_located((By.ID, "ctl00_MainContent_grdViewVeiculo_ctl00__0"))
                        )
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





















    # # ---------- SALVAR SMP (ROBUSTO, COM ERROS ACUMULADOS E PARADA IMEDIATA) ----------
    # def extrair_numero_smp_de_texto(texto: str) -> Optional[str]:
    #     if not texto:
    #         return None
    #     # tenta capturar formatos tipo "43527078/2025" ou "número 43527078"
    #     m = re.search(r"(?:SMP.*?n[aú]mero|n[aú]mero)[:\s]*([0-9]{4,12}/[0-9]{4}|[0-9]{4,12})",
    #                 texto, flags=re.IGNORECASE)
    #     if m:
    #         return m.group(1)
    #     m2 = re.search(r"\b([0-9]{4,10})\b", texto)
    #     if m2:
    #         return m2.group(1)
    #     return None


    # def pegar_texto_notificacao(driver):
    #     """
    #     Pega o texto da notificação (#notifTexto) usando innerText para preservar quebras <br>.
    #     Retorna string limpa ou "".
    #     """
    #     try:
    #         elem = driver.find_element(By.ID, "notifTexto")
    #         txt = elem.get_attribute("innerText") or ""
    #         return txt.strip()
    #     except:
    #         return ""


    # def capturar_radalerts(driver):
    #     """
    #     Retorna lista de tuples (element, texto) para radalerts visíveis.
    #     """
    #     res = []
    #     try:
    #         alertas = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radalert")
    #         for a in alertas:
    #             try:
    #                 if a.is_displayed():
    #                     txt = a.text.strip()
    #                     res.append((a, txt))
    #             except:
    #                 pass
    #     except:
    #         pass
    #     return res


    # def capturar_radconfirms(driver):
    #     """
    #     Retorna lista de tuples (element, texto) para radconfirms visíveis.
    #     """
    #     res = []
    #     try:
    #         confirms = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radconfirm")
    #         for c in confirms:
    #             try:
    #                 if c.is_displayed():
    #                     txt = c.text.strip()
    #                     res.append((c, txt))
    #             except:
    #                 pass
    #     except:
    #         pass
    #     return res


    # try:
    #     safe_click(driver, By.ID, "ctl00_MainContent_btnNovo", timeout=12)

    #     url_inicial = driver.current_url
    #     timeout_total = 40
    #     inicio = time.time()

    #     erros_coletados = []
    #     sm_numero = None
    #     notificacao_texto = ""

    #     # Notificação anterior (texto bruto)
    #     try:
    #         notificacao_antes = pegar_texto_notificacao(driver)
    #     except:
    #         notificacao_antes = ""

    #     print("⏳ Aguardando resposta da criação da SMP...")

    #     while time.time() - inicio < timeout_total:
    #         time.sleep(0.25)

    #         # 1) Verifica SMP no label (se existir no fluxo atual)
    #         try:
    #             label = driver.find_element(By.ID, "ctl00_MainContent_lblNumeroSM")
    #             try:
    #                 if label.is_displayed() and label.text.strip():
    #                     sm_numero = label.text.strip()
    #                     dados["numero_smp"] = sm_numero
    #                     print("✔ SMP criada (label):", sm_numero)
    #                     break
    #             except:
    #                 pass
    #         except:
    #             pass

    #         # 2) Caixa de notificação (toast) - pega innerText com <br>
    #         try:
    #             div = driver.find_element(By.ID, "divNotificacao")
    #             try:
    #                 if div.is_displayed():
    #                     notif = pegar_texto_notificacao(driver)

    #                     if notif and notif != notificacao_antes:
    #                         print("🔔 Notificação:", notif)
    #                         notificacao_texto = notif

    #                         # tenta fechar toast (se existir botão)
    #                         try:
    #                             driver.find_element(By.ID, "btnCloseNotificacao").click()
    #                         except:
    #                             pass

    #                         # SUCESSO via toast: procura padrão "foi salva com sucesso" ou "SMP de número"
    #                         if re.search(r"foi salva com sucesso|salva com sucesso|smp.*n[aú]mero",
    #                                     notif, flags=re.IGNORECASE):
    #                             num = extrair_numero_smp_de_texto(notif)
    #                             if num:
    #                                 sm_numero = num
    #                                 dados["numero_smp"] = sm_numero
    #                                 print("✔ SMP criada (toast):", sm_numero)
    #                             else:
    #                                 # às vezes só vem "SMP ... foi salva" sem número - consideramos sucesso
    #                                 sm_numero = extrair_numero_smp_de_texto(notif) or "DESCONHECIDO_VIA_TOAST"
    #                                 dados["numero_smp"] = sm_numero
    #                                 print("✔ SMP criada (toast, sem número):", sm_numero)
    #                             break
    #                         else:
    #                             # notif que não indica sucesso, considera possível erro/aviso
    #                             # acumula e interrompe (comportamento antigo)
    #                             erros_coletados.append(notif)
    #                             raise Exception("Erro crítico após salvar SMP (via toast)")
    #             except:
    #                 pass
    #         except:
    #             pass

    #         # 3) Captura radalerts (piscam rápido)
    #         alerts = capturar_radalerts(driver)
    #         if alerts:
    #             for alerta_elem, txt in alerts:
    #                 if not txt:
    #                     continue
    #                 print("⚠ Alerta Telerik detectado:", txt)
    #                 # sempre acumula o alerta no log
    #                 erros_coletados.append(txt)

    #                 # tenta clicar OK se existir botão
    #                 try:
    #                     btn = alerta_elem.find_element(By.CLASS_NAME, "rwPopupButton")
    #                     btn_text = btn.text.strip()

    #                     # 🔴 ADICIONE ESTE DELAY ANTES DO CLIQUE
    #                     time.sleep(0.45)  # garante que o evento onclick já foi anexado pelo Telerik

    #                     try:
    #                         btn.click()
    #                     except:
    #                         try:
    #                             driver.execute_script("arguments[0].click();", btn)
    #                         except:
    #                             pass

    #                     print("→ Clicado botão do alerta:", btn_text)

    #                 except:
    #                     pass

    #                 # Se for PGV: não assume sucesso -- aguarda redirecionamento por alguns instantes
    #                 if "chave pgv" in txt.lower():
    #                     print("⚠ PGV detectado — aguardando possível redirecionamento...")
    #                     # aguarda até 5s por mudança de URL ou por uma notificação de sucesso
    #                     waited = 0.0
    #                     sucesso_via_redirec = False
    #                     while waited < 5.0:
    #                         time.sleep(0.25)
    #                         waited += 0.25
    #                         # se a URL mudou → consideramos criado (redirecionamento)
    #                         try:
    #                             if driver.current_url != url_inicial:
    #                                 print("✔ Redirecionamento detectado após PGV.")
    #                                 sucesso_via_redirec = True
    #                                 break
    #                         except:
    #                             pass
    #                         # também checa se chegou alguma toast de sucesso
    #                         try:
    #                             notif_now = pegar_texto_notificacao(driver)
    #                             if notif_now and notif_now != notificacao_antes:
    #                                 if re.search(r"foi salva com sucesso|smp.*n[aú]mero", notif_now, flags=re.IGNORECASE):
    #                                     num = extrair_numero_smp_de_texto(notif_now)
    #                                     if num:
    #                                         sm_numero = num
    #                                         dados["numero_smp"] = sm_numero
    #                                     else:
    #                                         sm_numero = sm_numero or "DESCONHECIDO_VIA_TOAST"
    #                                         dados["numero_smp"] = sm_numero
    #                                     print("✔ SMP criada (detectada após PGV via toast):", sm_numero)
    #                                     sucesso_via_redirec = True
    #                                     break
    #                         except:
    #                             pass

    #                     if sucesso_via_redirec:
    #                         break
    #                     else:
    #                         # PGV apareceu, clicamos OK, mas NÃO houve redirecionamento nem toast de sucesso.
    #                         # Isso normalmente indica falha: acumulamos e seguimos (mas aqui interrompemos).
    #                         print("❌ PGV apareceu mas não houve redirecionamento → considera falha desse fluxo.")
    #                         raise Exception("Falha após PGV (sem redirecionamento)")
    #                 else:
    #                     # Se não for PGV (outro radalert) -> tratar como erro imediato
    #                     print("❌ Alerta Telerik não-PGV tratado como erro crítico.")
    #                     raise Exception("Erro crítico Telerik: " + txt)

    #         # 4) Captura radconfirms (podem ser avisos ou erros)
    #         confirms = capturar_radconfirms(driver)
    #         if confirms:
    #             for conf_elem, txt in confirms:
    #                 if not txt:
    #                     continue
    #                 print("⚠ Confirmação detectada:", txt)
    #                 # acumula sempre
    #                 erros_coletados.append(txt)
    #                 # tenta clicar OK/SIM
    #                 try:
    #                     for btn in conf_elem.find_elements(By.CLASS_NAME, "rwPopupButton"):
    #                         try:
    #                             txtbtn = btn.text.strip().upper()
    #                             if "OK" in txtbtn or "SIM" in txtbtn:
    #                                 try:
    #                                     btn.click()
    #                                 except:
    #                                     try:
    #                                         driver.execute_script("arguments[0].click();", btn)
    #                                     except:
    #                                         pass
    #                                 break
    #                         except:
    #                             pass
    #                 except:
    #                     pass

    #                 # se o texto indicar erro -> interrompe
    #                 if any(x in txt.lower() for x in ["falha", "erro", "não pode", "rejeitada"]):
    #                     print("❌ Confirmação contém indicação de erro.")
    #                     raise Exception("Erro crítico na confirmação: " + txt)

    #     # ---- AVALIAÇÃO FINAL ----
    #     if sm_numero:
    #         print("✔ SMP criada com sucesso:", sm_numero)

    #         if erros_coletados:
    #             # Log que será captado pelo FRONTEND!
    #             print("⚠ ALERTAS DURANTE A CRIAÇÃO DA SMP:")
    #             for err in erros_coletados:
    #                 print(" - " + err.replace("\n", " | "))

    #         # (IMPORTANTE: só retornar DEPOIS dos prints acima!)
    #         return


    #     # sem SMP → erro
    #     raise Exception(f"Falha ao salvar SMP — erros: {erros_coletados or 'Nenhuma resposta recebida'}")

    # except Exception as e:
    #     # se número da SMP foi criado ANTES do erro → retorna mesmo assim
    #     if "numero_smp" in dados:
    #         raise Exception(f"SMP criada ({dados['numero_smp']}) com erros: {e}")
    #     else:
    #         raise Exception(str(e))



    # ---------- SALVAR SMP (ROBUSTO, COM ERROS ACUMULADOS E PARADA IMEDIATA) ----------
    def extrair_numero_smp_de_texto(texto: str) -> Optional[str]:
        if not texto:
            return None
        m = re.search(r"(?:SMP.*?n[aú]mero|n[aú]mero)[:\s]*([0-9]{4,12}/[0-9]{4}|[0-9]{4,12})",
                    texto, flags=re.IGNORECASE)
        if m:
            return m.group(1)
        m2 = re.search(r"\b([0-9]{4,10})\b", texto)
        if m2:
            return m2.group(1)
        return None


    def pegar_texto_notificacao(driver):
        try:
            elem = driver.find_element(By.ID, "notifTexto")
            txt = elem.get_attribute("innerText") or ""
            return txt.strip()
        except:
            return ""


    def capturar_radalerts(driver):
        res = []
        try:
            alertas = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radalert")
            for a in alertas:
                try:
                    if a.is_displayed():
                        txt = a.text.strip()
                        res.append((a, txt))
                except:
                    pass
        except:
            pass
        return res


    def capturar_radconfirms(driver):
        res = []
        try:
            confirms = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radconfirm")
            for c in confirms:
                try:
                    if c.is_displayed():
                        txt = c.text.strip()
                        res.append((c, txt))
                except:
                    pass
        except:
            pass
        return res


    try:
        safe_click(driver, By.ID, "ctl00_MainContent_btnNovo", timeout=12)

        url_inicial = driver.current_url
        timeout_total = 80
        inicio = time.time()

        erros_coletados = []
        sm_numero = None

        notificacao_texto = ""   # CORREÇÃO 1 — controle atualizado somente aqui

        # leitura inicial
        try:
            notificacao_antes = pegar_texto_notificacao(driver)
        except:
            notificacao_antes = ""

        print("⏳ Aguardando resposta da criação da SMP...")

        while time.time() - inicio < timeout_total:
            time.sleep(0.25)

            # 1) Label da SMP
            try:
                label = driver.find_element(By.ID, "ctl00_MainContent_lblNumeroSM")
                try:
                    if label.is_displayed() and label.text.strip():
                        sm_numero = label.text.strip()
                        dados["numero_smp"] = sm_numero
                        print("✔ SMP criada (label):", sm_numero)
                        break
                except:
                    pass
            except:
                pass

            # 2) Toast
            try:
                div = driver.find_element(By.ID, "divNotificacao")
                try:
                    if div.is_displayed():
                        notif = pegar_texto_notificacao(driver)

                        # CORREÇÃO 2 — compara com notificacao_texto (não notificacao_antes)
                        if notif and notif != notificacao_texto:
                            print("🔔 Notificação:", notif)

                            # atualiza controle
                            notificacao_texto = notif

                            try:
                                driver.find_element(By.ID, "btnCloseNotificacao").click()
                            except:
                                pass

                            # sucesso
                            if re.search(r"foi salva com sucesso|salva com sucesso|smp.*n[aú]mero",
                                        notif, flags=re.IGNORECASE):
                                num = extrair_numero_smp_de_texto(notif)
                                if num:
                                    sm_numero = num
                                    dados["numero_smp"] = sm_numero
                                    print("✔ SMP criada (toast):", sm_numero)
                                else:
                                    sm_numero = "DESCONHECIDO_VIA_TOAST"
                                    dados["numero_smp"] = sm_numero
                                    print("✔ SMP criada (toast, sem número):", sm_numero)
                                break
                            else:
                                # CORREÇÃO 3 — não quebramos o fluxo
                                erros_coletados.append(notif)
                                print("⚠ Toast não conclusivo, aguardando eventos...")
                except:
                    pass
            except:
                pass

            # 3) Radalerts
            alerts = capturar_radalerts(driver)
            if alerts:
                for alerta_elem, txt in alerts:
                    if not txt:
                        continue
                    print("⚠ Alerta Telerik detectado:", txt)
                    erros_coletados.append(txt)

                    try:
                        btn = alerta_elem.find_element(By.CLASS_NAME, "rwPopupButton")
                        btn_text = btn.text.strip()
                        time.sleep(0.45)
                        try:
                            btn.click()
                        except:
                            try:
                                driver.execute_script("arguments[0].click();", btn)
                            except:
                                pass
                        print("→ Clicado botão do alerta:", btn_text)
                    except:
                        pass

                    if "chave pgv" in txt.lower():
                        print("⚠ PGV detectado — aguardando redirecionamento...")
                        waited = 0.0
                        sucesso_via_redirec = False
                        while waited < 12.0:
                            time.sleep(0.25)
                            waited += 0.25

                            try:
                                if driver.current_url != url_inicial:
                                    print("✔ Redirecionamento detectado após PGV.")
                                    sucesso_via_redirec = True
                                    break
                            except:
                                pass

                            # check toast
                            try:
                                notif_now = pegar_texto_notificacao(driver)
                                if notif_now and notif_now != notificacao_texto:
                                    if re.search(r"foi salva com sucesso|smp.*n[aú]mero",
                                                notif_now, flags=re.IGNORECASE):
                                        num = extrair_numero_smp_de_texto(notif_now)
                                        if num:
                                            sm_numero = num
                                            dados["numero_smp"] = sm_numero
                                        else:
                                            sm_numero = "DESCONHECIDO_VIA_TOAST"
                                            dados["numero_smp"] = sm_numero
                                        print("✔ SMP criada (PGV via toast):", sm_numero)
                                        sucesso_via_redirec = True
                                        break
                                    notificacao_texto = notif_now
                            except:
                                pass

                        if sucesso_via_redirec:
                            break
                        else:
                            print("❌ PGV sem redirecionamento → falha.")
                            raise Exception("Falha após PGV (sem redirecionamento)")
                    else:
                        print("❌ Alerta Telerik não-PGV → erro crítico.")
                        raise Exception("Erro crítico Telerik: " + txt)

            # 4) Radconfirms
            confirms = capturar_radconfirms(driver)
            if confirms:
                for conf_elem, txt in confirms:
                    if not txt:
                        continue
                    print("⚠ Confirmação detectada:", txt)
                    erros_coletados.append(txt)

                    try:
                        for btn in conf_elem.find_elements(By.CLASS_NAME, "rwPopupButton"):
                            try:
                                txtbtn = btn.text.strip().upper()
                                if "OK" in txtbtn or "SIM" in txtbtn:
                                    try:
                                        btn.click()
                                    except:
                                        try:
                                            driver.execute_script("arguments[0].click();", btn)
                                        except:
                                            pass
                                    break
                            except:
                                pass
                    except:
                        pass

                    if any(x in txt.lower() for x in ["falha", "erro", "não pode", "rejeitada"]):
                        print("❌ Confirmação contém indicação de erro.")
                        raise Exception("Erro crítico na confirmação: " + txt)


        # ---- AVALIAÇÃO FINAL (CORREÇÃO 4 — FAILSAFE) ----
        if not sm_numero:
            try:
                label = driver.find_element(By.ID, "ctl00_MainContent_lblNumeroSM")
                if label.is_displayed() and label.text.strip():
                    sm_numero = label.text.strip()
                    dados["numero_smp"] = sm_numero
                    print("✔ SMP encontrada na verificação final:", sm_numero)
                    return
            except:
                pass

        if sm_numero:
            print("✔ SMP criada com sucesso:", sm_numero)

            if erros_coletados:
                print("⚠ ALERTAS DURANTE A CRIAÇÃO DA SMP:")
                for err in erros_coletados:
                    print(" - " + err.replace("\n", " | "))

            return

        # se ainda assim não encontrou → falhou
        raise Exception(f"Falha ao salvar SMP — erros: {erros_coletados or 'Nenhuma resposta recebida'}")

    except Exception as e:
        if "numero_smp" in dados:
            raise Exception(f"SMP criada ({dados['numero_smp']}) com erros: {e}")
        else:
            raise Exception(str(e))
