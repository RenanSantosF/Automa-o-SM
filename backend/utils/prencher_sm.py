import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from utils.calcula_distancia import calcular_data_entrega
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, NoSuchElementException, ElementNotInteractableException
from utils.exceptions import ReiniciarProcessoException

def formatar_cnpj(cnpj_str):
    cnpj_str = ''.join(filter(str.isdigit, cnpj_str))  # Remove qualquer caractere não numérico
    if len(cnpj_str) != 14:
        raise ValueError(f"CNPJ inválido: {cnpj_str}")
    return f"{cnpj_str[:2]}.{cnpj_str[2:5]}.{cnpj_str[5:8]}/{cnpj_str[8:12]}-{cnpj_str[12:]}"


def preencher_sm(driver, dados):
    driver.get("https://novoapisullog.apisul.com.br/SMP/0")

    try:
        # Espera até que um elemento específico esteja presente no DOM (ex: o campo de login ou outro identificador confiável)
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente"))
        )
    except Exception as e:
        print("Erro ao carregar a página:", e)

    try:
        print("Iniciou vinculação de ponto de origem")
        vincular_ponto_origem = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
        vincular_ponto_origem.click()

        # Espera até o elemento com ID 'rcbIdentificadorPonto_Input' estar presente no DOM e visível
        WebDriverWait(driver, 20).until(
            EC.visibility_of_element_located((By.ID, "rcbIdentificadorPonto_Input"))
        )
    except Exception as e:
        print("Erro ao clicar em 'Vincular ponto origem':", e)
        raise Exception(f"Erro ao clicar em 'Vincular ponto origem': {e}")

    try:
        print("Insere CNPJ de origem")
        cnpj_formatado = formatar_cnpj(dados["remetente_cnpj"])
        remetente_input = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
        remetente_input.clear()
        remetente_input.send_keys(cnpj_formatado)

        try:
            WebDriverWait(driver, 15).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "ul.rcbList li.rcbTemplate"))
            )
        except TimeoutException:
            print("Nenhum remetente encontrado (autocomplete_smp não apareceu).")
            raise Exception("Remetente não encontrado")

        print("Seleciona ponto de origem")
        remetente_input.send_keys(Keys.DOWN)
        remetente_input.send_keys(Keys.ENTER)
        time.sleep(1)

        remetente_input = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
        nome_completo_remetente_cadastrado = remetente_input.get_attribute("value")

        if not nome_completo_remetente_cadastrado.strip():
            raise Exception("Remetente não foi preenchido corretamente após ENTER.")

        dados["remetente_cadastrado_apisul"] = nome_completo_remetente_cadastrado
        print("Remetente cadastrado na apisul:", nome_completo_remetente_cadastrado)

        botao_salvar_remetente = driver.find_element(
            By.NAME, "ctl00$MainContent$gridPontosVinculados$ctl00$ctl02$ctl02$btnSalvarPontoSMP"
        )
        print("Clica em salvar remetente")
        botao_salvar_remetente.click()

    except TimeoutException as e:
        print("Erro desconhecido ao preencher remetente", e)
        raise ReiniciarProcessoException("Erro desconhecido ao preencher remetente") from e
        

    try:

        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00__0"))
        )

        time.sleep(0.5)

        # Clica em vincular ponto pra colocar destino
        try:
            
            vincular_ponto_destino = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
        
        except NoSuchElementException:
            raise Exception("Remetente não cadastrado")
        

        try:
            print("clica em vincular ponto de destino")
            vincular_ponto_destino = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
            vincular_ponto_destino.click()

            # Espera até o elemento com ID 'rcbIdentificadorPonto_Input' estar presente no DOM e visível
            WebDriverWait(driver, 20).until(
                EC.visibility_of_element_located((By.ID, "rcbIdentificadorPonto_Input"))
            )
        except Exception as e:
            print("Erro ao clicar em 'Vincular ponto origem':", e)
            raise Exception(f"Erro ao clicar em 'Vincular ponto origem': {e}")

        
        # Formata o CNPJ do destinatário
        print("Insere CNPJ no ponto de destino")
        cnpj_formatado = formatar_cnpj(dados["destinatario_cnpj"])

        # Encontra o input do destinatário (é o mesmo ID do remetente)
        destinatario_input = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
        destinatario_input.clear()
        destinatario_input.send_keys(cnpj_formatado)

        # Aguarda a lista correta de sugestões aparecer (com div.autocomplete_smp)
        try:
            WebDriverWait(driver, 15).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "ul.rcbList li.rcbTemplate"))
            )
        except TimeoutException:
            print("Nenhum destinatário encontrado (autocomplete_smp não apareceu).")
            raise Exception("Destinatário não encontrado")

        # Seleciona o item da lista
        print("Seleciona destinatário")
        destinatario_input.send_keys(Keys.DOWN)
        destinatario_input.send_keys(Keys.ENTER)
        time.sleep(1)

        # Rebusca o valor após pressionar ENTER
        destinatario_input = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
        nome_completo_destinatario_cadastrado = destinatario_input.get_attribute("value")

        if not nome_completo_destinatario_cadastrado.strip():
            raise Exception("Destinatário não foi preenchido corretamente após ENTER.")

        # Salva o valor no dicionário
        dados["destinatario_cadastrado_apisul"] = nome_completo_destinatario_cadastrado
        print("Destinatário cadastrado na apisul:", nome_completo_destinatario_cadastrado)

        print("Insere tempo de permanência")
        botao_tempo_permanencia = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtTempoPermanencia_dateInput")
        botao_tempo_permanencia.send_keys("1100")
        time.sleep(0.5)
    # except Exception as e:
    #     print("Erro ao preencher destino:", e)
    #     raise Exception(f"Erro ao preencher destino: {e}")
    except TimeoutException as e:
        print("Erro desconhecido ao preencher destino:", e)
        raise ReiniciarProcessoException("Erro desconhecido ao preencher destino") from e
        

    # Data estimada
    try:
        print("Insere data estimada")
        data_formatada = calcular_data_entrega(dados["local_origem"], dados["local_destino"])
        print("Previsão de entrega:", data_formatada)


        
        # Espera até que o campo esteja visível e habilitado
        campo_data_entrega = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtPrevisaoChegada_dateInput"))
        )

        # Garante que o campo está realmente interativo
        campo_data_entrega.click()
        time.sleep(1)
        print("Data formatada")
        print(data_formatada)
        campo_data_entrega.send_keys(data_formatada)
        time.sleep(1)
        campo_data_entrega.send_keys(Keys.TAB)


    except Exception as e:
        print("Erro ao preencher campo de data estimada:", e)
        raise Exception(f"Erro ao preencher campo de data estimada:", e)
    time.sleep(0.5)

    try:

        print("Insere tipo do ponto")
        campo_tipo_do_ponto = driver.find_element(By.ID, "cmbTipoPontoSMP_Input")
        campo_tipo_do_ponto.send_keys("ENTREGA")    
        campo_tipo_do_ponto.send_keys(Keys.ENTER)

    except Exception as e:

        print("Erro ao preencher o campo tipo do ponto:", e)
        raise Exception(f"Erro ao preencher o campo tipo do ponto:", e)
    
    try:

        time.sleep(1)
        print("Salva destinatário")
        # Espera até que o botão esteja clicável
        botao_salvar_destinatario = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_btnSalvarPontoSMP")))
        botao_salvar_destinatario.click()
    except Exception as e:
        print("Erro ao salvar o destinatário:", e)
        raise Exception(f"Erro ao salvar o destinatário:", e)
    
    try:
        # Verifica se o destinatário foi informado antes de adicionar projeto
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00__1"))
        )
        time.sleep(0.5)

        # Expande o ponto
        try:
            botao_extender_ponto = driver.find_element(
                By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl07_GECBtnExpandColumn"
            )
        except NoSuchElementException:
            raise Exception("Destinatário não cadastrado")

        botao_extender_ponto.click()

        print("Adiciona projeto")

        # Clicar no botão adicionar projeto com tentativa
        for tentativa in range(3):
            try:
                botao_adicionar_projeto = WebDriverWait(driver, 15).until(
                    EC.element_to_be_clickable((
                        By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl00_InitInsertButton"
                    ))
                )
                botao_adicionar_projeto.click()
                break
            except (StaleElementReferenceException, TimeoutException) as e:
                print(f"Tentativa {tentativa+1} de clicar no botão adicionar projeto falhou: {e}")
                time.sleep(1)
        else:
            raise ReiniciarProcessoException("Não foi possível clicar no botão de adicionar projeto.")

        time.sleep(0.5)

        # Preencher tipo de projeto
        for tentativa in range(3):
            try:
                campo_tipo_projeto = WebDriverWait(driver, 15).until(
                    EC.element_to_be_clickable((
                        By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input"
                    ))
                )
                campo_tipo_projeto.send_keys("DELLMAR - ESPECIFICAS")
                time.sleep(0.5)
                campo_tipo_projeto.send_keys(Keys.ENTER)
                time.sleep(0.5)
                break
            except (StaleElementReferenceException, TimeoutException) as e:
                print(f"Tentativa {tentativa+1} de preencher tipo de projeto falhou: {e}")
                time.sleep(1)
        else:
            raise ReiniciarProcessoException("Falha ao preencher o tipo de projeto.")

        # Tipo de carga
        for tentativa in range(3):
            try:
                campo_tipo_carga = driver.find_element(
                    By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbTipoCarga_Input"
                )
                campo_tipo_carga.send_keys("DIVERSOS")
                time.sleep(0.5)
                campo_tipo_carga.send_keys(Keys.ENTER)
                time.sleep(0.5)
                break
            except (StaleElementReferenceException, TimeoutException) as e:
                print(f"Tentativa {tentativa+1} de preencher tipo de carga falhou: {e}")
                time.sleep(1)
        else:
            raise ReiniciarProcessoException("Falha ao preencher o tipo de carga.")

        # Valor da carga
        for tentativa in range(3):
            try:
                campo_valor_carga = driver.find_element(
                    By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rntxtValorCarga"
                )
                valor_str = dados["valor_total_carga"]
                valor_float = float(valor_str.replace(",", "."))
                valor_formatado = f"{valor_float:,.2f}".replace(".", ",")

                print(valor_formatado)

                campo_valor_carga.clear()
                campo_valor_carga.send_keys(valor_formatado)
                time.sleep(0.5)
                campo_valor_carga.send_keys(Keys.TAB)
                time.sleep(0.5)
                break
            except (StaleElementReferenceException, TimeoutException) as e:
                print(f"Tentativa {tentativa+1} de preencher valor da carga falhou: {e}")
                time.sleep(1)
        else:
            raise ReiniciarProcessoException("Falha ao preencher o valor da carga.")

        # Clicar no botão salvar projeto
        for tentativa in range(3):
            try:
                botao_salvar_projeto = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((
                        By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_btnSalvarProjeto"
                    ))
                )
                botao_salvar_projeto.click()
                break
            except StaleElementReferenceException as e:
                print(f"Tentativa {tentativa+1} de clicar em salvar projeto falhou por stale: {e}")
                time.sleep(1)
        else:
            raise ReiniciarProcessoException("Não foi possível clicar no botão de salvar projeto.")

    except TimeoutException as e:
        print("Erro de timeout ao preencher projeto:", e)
        raise ReiniciarProcessoException("Erro de timeout ao preencher projeto") from e


    time.sleep(2)

        # Preencher Transportadora
    campo_transportadora = driver.find_element(By.ID, "ctl00_MainContent_txtEmitenteTransportadora_Input")
    campo_transportadora.send_keys("DELLMAR TRANSPORTES")  # Exemplo fixo, pode vir de dados
    campo_transportadora.send_keys(Keys.ENTER)

    # Preencher Campo Tipo operação
    campo_tipo_operação = driver.find_element(By.ID, "ctl00_MainContent_cmbTipoOperacao_Input")
    campo_tipo_operação.send_keys("TRAN")  # Exemplo fixo, pode vir de dados
    campo_tipo_operação.send_keys(Keys.ENTER)
    
    # Preencher horário de inicio com o horário atual
    botao_horário_inicio = driver.find_element(By.ID, "MainContent_btnAdicionarHorario")
    botao_horário_inicio.click()
    time.sleep(2)

    print("Inicia preenchimento de placa")

    # Mapeamento para conversão entre letra e número no 4º caractere
    NUMERO_PARA_LETRA = {
        '0': 'A', '1': 'B', '2': 'C', '3': 'D', '4': 'E',
        '5': 'F', '6': 'G', '7': 'H', '8': 'I', '9': 'J'
    }
    LETRA_PARA_NUMERO = {v: k for k, v in NUMERO_PARA_LETRA.items()}


    def gerar_variacoes_placa(placa: str) -> list[str]:
        placa = placa.strip().upper()
        variacoes = [placa]

        if len(placa) == 7:
            char4 = placa[3]

            # Se letra, tenta converter para número (padrão antigo)
            if char4.isalpha() and char4 in LETRA_PARA_NUMERO:
                num = LETRA_PARA_NUMERO[char4]
                placa_antiga = placa[:3] + num + placa[4:]
                variacoes.append(placa_antiga)

            # Se número, tenta converter para letra (padrão Mercosul)
            elif char4.isdigit() and char4 in NUMERO_PARA_LETRA:
                letra = NUMERO_PARA_LETRA[char4]
                placa_mercosul = placa[:3] + letra + placa[4:]
                variacoes.append(placa_mercosul)

        # Remove duplicatas mantendo a ordem
        resultado = []
        seen = set()
        for v in variacoes:
            if v not in seen:
                resultado.append(v)
                seen.add(v)

        return resultado


    def preencher_placa_e_confirmar(placa_texto: str):
        placa = driver.find_element(By.ID, "txtVeiculo_Input")
        placa.clear()
        placa.send_keys(placa_texto)

        try:
            WebDriverWait(driver, 10).until(
                lambda d: any(
                    ul.find_elements(By.TAG_NAME, "li")
                    for ul in d.find_elements(By.CSS_SELECTOR, "div.RadAutoCompleteBoxPopup ul.racList")
                    if ul.is_displayed()
                )
            )
        except TimeoutException:
            raise Exception("A lista de placas não carregou a tempo.")

        placa.send_keys(Keys.TAB)

        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "span.racTextToken"))
            )
        except TimeoutException:
            raise Exception("A placa não foi reconhecida após pressionar TAB.")

        spans = driver.find_elements(By.CSS_SELECTOR, "span.racTextToken")
        placas_encontradas = [span.text.strip().upper() for span in spans]

        if placa_texto not in placas_encontradas:
            raise Exception(f"Placa '{placa_texto}' não encontrada no sistema.")

        botao_confirmar_placa = driver.find_element(By.ID, "ctl00_MainContent_btnVinculoVeiculo")
        botao_confirmar_placa.click()


    def tentar_preencher_placa(placa_texto: str, max_tentativas=3):
        variacoes = gerar_variacoes_placa(placa_texto)

        for variacao in variacoes:
            for tentativa in range(1, max_tentativas + 1):
                try:
                    campo_placa = driver.find_element(By.ID, "txtVeiculo_Input")
                    campo_placa.clear()

                    preencher_placa_e_confirmar(variacao)

                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.ID, "ctl00_MainContent_grdViewVeiculo_ctl00__0"))
                    )

                    print(f"Placa '{variacao}' inserida com sucesso na tentativa {tentativa}.")
                    return  # sucesso!

                except Exception as e:
                    print(f"Tentativa {tentativa} falhou para a placa '{variacao}': {e}")
                    if tentativa == max_tentativas:
                        print(f"Todas tentativas falharam para a variação '{variacao}'")
                    else:
                        time.sleep(1)

        raise Exception(f"Nenhuma variação da placa '{placa_texto}' foi aceita após {max_tentativas} tentativas por variação.")


    try:
        print("Inserindo placa cavalo")
        tentar_preencher_placa(dados.get("placa_cavalo", ""))

        time.sleep(0.5)

        print("Inserindo placa carreta")
        if dados.get("placa_carreta_1") and dados["placa_carreta_1"].strip():
            tentar_preencher_placa(dados["placa_carreta_1"])

        time.sleep(0.5)

        print("Inserindo placa carreta 2")
        if dados.get("placa_carreta_2") and dados["placa_carreta_2"].strip():
            tentar_preencher_placa(dados["placa_carreta_2"])

    except Exception as e:
        print("Erro ao preencher a placa da carreta:", e)
        raise



















    time.sleep(2)
    # Seleção da rota
    print("Adicionando rota")
    botao_rota_existente = driver.find_element(By.ID, "MainContent_rblTipoRota_1")
    botao_rota_existente.click()
    time.sleep(0.5)
    # Espera até que o botão "rota cliente" esteja clicável
    try:
        botao_rota_cliente = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "MainContent_rblRotaExistente_0"))
        )
        botao_rota_cliente.click()
    except TimeoutException:
        raise Exception("O botão 'Rota Cliente' não ficou disponível a tempo.")

    time.sleep(0.5)

    try:
        campo_rota = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "ctl00_MainContent_rcbRota_Input"))
        )
        campo_rota.click()

        # Espera até que as rotas estejam visíveis
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "ul.rcbList li"))
        )

        time.sleep(1)  # Pequeno delay para garantir que todas as opções renderizem

        # Captura todas as rotas visíveis no dropdown
        rotas_elementos = driver.find_elements(By.CSS_SELECTOR, "ul.rcbList li")
        rotas_disponiveis = [rota.text.strip() for rota in rotas_elementos if rota.text.strip()]

        if not rotas_disponiveis:
            raise Exception("Nenhuma rota disponível foi encontrada.")

        # Seleciona a primeira rota da lista
        # Re-obtenha o campo antes de usar send_keys, pois ele pode ter sido "atualizado" pelo JS
        campo_rota = driver.find_element(By.ID, "ctl00_MainContent_rcbRota_Input")
        campo_rota.send_keys(Keys.DOWN)
        campo_rota.send_keys(Keys.ENTER)
        time.sleep(2)

        # Captura o valor selecionado no campo de rota
        campo_rota = driver.find_element(By.ID, "ctl00_MainContent_rcbRota_Input")

        rota_selecionada = campo_rota.get_attribute("value").strip()
        print("Rota selecionada:", rota_selecionada)

        # Você poderá depois armazenar essa variável no banco de dados
        dados["rota_selecionada"] = rota_selecionada

        # Armazena todas as rotas no seu dicionário para atualizar depois
        dados["rotas_cadastradas_apisul"] = rotas_disponiveis
        print("Rotas disponíveis:", rotas_disponiveis)


    except Exception as e:
        print("❌ Erro ao selecionar rota:", e)
        raise Exception(f"Erro ao selecionar rota: {e}")
            
    try:

        print("Incluindo motorista")
        botao_incluir_motorista = driver.find_element(By.ID, "ctl00_MainContent_btnVinculaMotorista")
        botao_incluir_motorista.click()
        time.sleep(1)

        botao_tipo_documento = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_tipoDeDocumento_rcbTipoDocumento_Input")
        botao_tipo_documento.send_keys("CPF")    
        botao_tipo_documento.send_keys(Keys.ENTER)
        time.sleep(1)

        campo_cpf_condutor = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_tipoDeDocumento_txtDocumento")
        campo_cpf_condutor.click()
        time.sleep(0.5)
        campo_cpf_condutor.clear()
        time.sleep(0.5)
        campo_cpf_condutor.send_keys(dados["cpf_condutor"])

        time.sleep(0.5)

        botao_pesquisar_condutor = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_btnPesquisarMotorista")
        botao_pesquisar_condutor.click()
        time.sleep(3)

        try:
            botao_adicionar_condutor = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "ctl00_MainContent_modalPopupMotorista_C_grdViewMotoristaConsulta_ctl00_ctl04_btnSalvarMotoristaPrevia"))
            )

            botao_adicionar_condutor.click()
        except Exception:
            raise Exception("Condutor não cadastrado na apisul")
        
        # Espera aparecer a linha da tabela com o condutor inserido
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "ctl00_MainContent_modalPopupMotorista_C_grdViewMotoristaPrevia_ctl00__0"))
            )
        except Exception:
            raise Exception("❌ A linha com o condutor não apareceu. O cadastro pode ter falhado.")


        try:
            print("Salvando dados do motorista")
            botao_confirma_condutor = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "ctl00_MainContent_modalPopupMotorista_C_btnSalvarMotorista"))
            )
            botao_confirma_condutor.click()
            time.sleep(3)
        except Exception:
            raise Exception("❌ Erro ao clicar no botão de confirmar condutor.")

    except Exception as e:
        print("Erro ao inserir o condutor:", e)
        raise Exception(f"Erroa ao inserir o condutor:", e)
    



    def clicar_com_seguranca(driver, by, valor, timeout=10, scroll=True, tentativas=3, delay_entre_tentativas=1.5):
        ultima_excecao = None

        for tentativa in range(tentativas):
            try:
                print(f"🖱️ Tentando clicar no elemento: {valor} (tentativa {tentativa + 1})")

                elemento = WebDriverWait(driver, timeout).until(
                    EC.element_to_be_clickable((by, valor))
                )

                if scroll:
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
                    time.sleep(0.3)

                try:
                    elemento.click()
                except ElementNotInteractableException:
                    driver.execute_script("arguments[0].click();", elemento)

                print(f"✅ Clique bem-sucedido no elemento: {valor}")
                return  # sucesso, sai da função

            except Exception as e:
                ultima_excecao = e
                print(f"⚠️ Falha ao clicar no elemento: {valor} (tentativa {tentativa + 1})")
                time.sleep(delay_entre_tentativas)

        # Se chegou aqui, todas as tentativas falharam
        raise Exception(f"❌ Falha ao clicar no elemento '{valor}' após {tentativas} tentativas. Último erro: {ultima_excecao}")

    
    try:
        clicar_com_seguranca(driver, By.ID, "ctl00_MainContent_btnNovo")

        timeout = 40
        start_time = time.time()

        sm_numero = None
        notificacao_texto = None
        erro_detectado = False

        while time.time() - start_time < timeout:
            time.sleep(1)

            # 1. Notificação
            try:
                div_notificacao = driver.find_element(By.ID, "divNotificacao")
                if div_notificacao.is_displayed():
                    notif_text = driver.find_element(By.ID, "notifTexto").text.strip()
                    print(f"📢 Notificação: {notif_text}")
                    notificacao_texto = notif_text

                    # Fecha se possível
                    try:
                        driver.find_element(By.ID, "btnCloseNotificacao").click()
                    except:
                        pass

                    if "foi salva com sucesso" in notif_text:
                        sm_numero = notif_text.split("número ")[-1].split(" ")[0]
                        print(f"✅ SMP criada com sucesso: {sm_numero}")
                        dados["numero_smp"] = sm_numero
                        return sm_numero
                    else:
                        erro_detectado = True
                        break  # erro detectado, sai do loop
            except:
                pass

            # 2. Alertas tipo "PGV"
            try:
                alertas = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radalert")
                for alerta in alertas:
                    if alerta.is_displayed():
                        alerta_texto = alerta.text.strip()
                        print(f"⚠️ Alerta PGV: {alerta_texto}")

                        try:
                            ok_btn = alerta.find_element(By.CLASS_NAME, "rwPopupButton")
                            ok_btn.click()
                            erro_detectado = True
                            notificacao_texto = alerta_texto
                        except:
                            pass
                        break
            except:
                pass

            # 3. Checa se o número da SMP apareceu
            try:
                sm_label = driver.find_element(By.ID, "ctl00_MainContent_lblNumeroSM")
                if sm_label.is_displayed() and sm_label.text.strip():
                    sm_numero = sm_label.text.strip()
                    print(f"✅ SMP detectada por label: {sm_numero}")
                    dados["numero_smp"] = sm_numero
                    return
            except:
                pass

            # 3. Confirmação tipo "Deseja continuar?" (radconfirm)
            try:
                confirmacoes = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radconfirm")
                for confirm in confirmacoes:
                    if confirm.is_displayed():
                        texto_confirm = confirm.text.strip()
                        print(f"❓ Confirmação detectada: {texto_confirm}")

                        try:
                            ok_btns = confirm.find_elements(By.CLASS_NAME, "rwPopupButton")
                            for btn in ok_btns:
                                if "OK" in btn.text:
                                    btn.click()
                                    print("✅ Clique automático no botão OK da confirmação.")
                                    break
                        except Exception as e:
                            print("⚠️ Erro ao clicar em OK na confirmação:", e)
                        break  # sai do for
            except:
                pass

        # Após loop, decide se erro ou timeout
        if erro_detectado:
            raise Exception(f"❌ Erro ao salvar SMP: {notificacao_texto or 'erro não especificado'}")

        raise Exception("⏱️ Timeout: Nenhuma resposta ao tentar salvar SMP.")

    except Exception as e:
        print("❌ Erro final ao salvar SMP:", e)
        raise