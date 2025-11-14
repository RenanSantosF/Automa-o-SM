# import time
# from selenium.webdriver.common.by import By
# from selenium.webdriver.common.keys import Keys
# from selenium.webdriver.common.action_chains import ActionChains
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from utils.calcula_distancia import calcular_data_entrega
# from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, NoSuchElementException, ElementNotInteractableException
# from utils.exceptions import ReiniciarProcessoException

# def formatar_cnpj(cnpj_str):
#     cnpj_str = ''.join(filter(str.isdigit, cnpj_str))  # Remove qualquer caractere não numérico
#     if len(cnpj_str) != 14:
#         raise ValueError(f"CNPJ inválido: {cnpj_str}")
#     return f"{cnpj_str[:2]}.{cnpj_str[2:5]}.{cnpj_str[5:8]}/{cnpj_str[8:12]}-{cnpj_str[12:]}"


# def preencher_sm(driver, dados):
#     driver.get("https://novoapisullog.apisul.com.br/SMP/0")

#     try:
#         # Espera até que um elemento específico esteja presente no DOM (ex: o campo de login ou outro identificador confiável)
#         WebDriverWait(driver, 20).until(
#             EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente"))
#         )
#     except Exception as e:
#         print("Erro ao carregar a página:", e)

#     try:
#         print("Iniciou vinculação de ponto de origem")
#         vincular_ponto_origem = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
#         vincular_ponto_origem.click()

#         WebDriverWait(driver, 20).until(
#             EC.visibility_of_element_located((By.ID, "rcbIdentificadorPonto_Input"))
#         )

#         print("Insere CNPJ de origem")
#         cnpj_formatado = formatar_cnpj(dados["remetente_cnpj"])
#         remetente_input = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
#         remetente_input.clear()
#         remetente_input.send_keys(cnpj_formatado)

#         WebDriverWait(driver, 15).until(
#             EC.element_to_be_clickable((By.CSS_SELECTOR, "ul.rcbList li.rcbTemplate"))
#         )

#         print("Seleciona ponto de origem")
#         remetente_input.send_keys(Keys.DOWN)
#         remetente_input.send_keys(Keys.ENTER)
#         time.sleep(1)

#         remetente_input = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
#         nome_completo_remetente_cadastrado = remetente_input.get_attribute("value")

#         if not nome_completo_remetente_cadastrado.strip():
#             raise Exception("Remetente não foi preenchido corretamente após ENTER.")

#         dados["remetente_cadastrado_apisul"] = nome_completo_remetente_cadastrado
#         print("Remetente cadastrado na apisul:", nome_completo_remetente_cadastrado)

#         botao_salvar_remetente = driver.find_element(
#             By.NAME, "ctl00$MainContent$gridPontosVinculados$ctl00$ctl02$ctl02$btnSalvarPontoSMP"
#         )
#         print("Clica em salvar remetente")
#         botao_salvar_remetente.click()

#     except StaleElementReferenceException as e:
#         print("Erro StaleElementReference ao preencher remetente:", e)
#         raise ReiniciarProcessoException("Erro ao preencher remetente, reiniciar processo") from e

#     except TimeoutException as e:
#         print("Timeout ao preencher remetente:", e)
#         raise ReiniciarProcessoException("Timeout ao preencher remetente") from e

#     except Exception as e:
#         print("Erro inesperado ao preencher remetente:", e)
#         raise


#     try:

#         WebDriverWait(driver, 15).until(
#             EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00__0"))
#         )

#         time.sleep(0.5)

#         # Clica em vincular ponto pra colocar destino
#         try:
            
#             vincular_ponto_destino = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
        
#         except NoSuchElementException:
#             raise Exception("Remetente não cadastrado")
        

#         try:
#             print("clica em vincular ponto de destino")
#             vincular_ponto_destino = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
#             vincular_ponto_destino.click()

#             # Espera até o elemento com ID 'rcbIdentificadorPonto_Input' estar presente no DOM e visível
#             WebDriverWait(driver, 20).until(
#                 EC.visibility_of_element_located((By.ID, "rcbIdentificadorPonto_Input"))
#             )
#         except Exception as e:
#             print("Erro ao clicar em 'Vincular ponto origem':", e)
#             raise Exception(f"Erro ao clicar em 'Vincular ponto origem': {e}")

        
#         # Formata o CNPJ do destinatário
#         print("Insere CNPJ no ponto de destino")
#         cnpj_formatado = formatar_cnpj(dados["destinatario_cnpj"])

#         # Encontra o input do destinatário (é o mesmo ID do remetente)
#         destinatario_input = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
#         destinatario_input.clear()
#         destinatario_input.send_keys(cnpj_formatado)

#         # Aguarda a lista correta de sugestões aparecer (com div.autocomplete_smp)
#         try:
#             WebDriverWait(driver, 15).until(
#                 EC.element_to_be_clickable((By.CSS_SELECTOR, "ul.rcbList li.rcbTemplate"))
#             )
#         except TimeoutException:
#             print("Nenhum destinatário encontrado (autocomplete_smp não apareceu).")
#             raise Exception("Destinatário não encontrado")

#         # Seleciona o item da lista
#         print("Seleciona destinatário")
#         destinatario_input.send_keys(Keys.DOWN)
#         destinatario_input.send_keys(Keys.ENTER)
#         time.sleep(1)

#         # Rebusca o valor após pressionar ENTER
#         destinatario_input = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
#         nome_completo_destinatario_cadastrado = destinatario_input.get_attribute("value")

#         if not nome_completo_destinatario_cadastrado.strip():
#             raise Exception("Destinatário não foi preenchido corretamente após ENTER.")

#         # Salva o valor no dicionário
#         dados["destinatario_cadastrado_apisul"] = nome_completo_destinatario_cadastrado
#         print("Destinatário cadastrado na apisul:", nome_completo_destinatario_cadastrado)

#         print("Insere tempo de permanência")
#         botao_tempo_permanencia = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtTempoPermanencia_dateInput")
#         botao_tempo_permanencia.send_keys("1100")
#         time.sleep(0.5)
#     # except Exception as e:
#     #     print("Erro ao preencher destino:", e)
#     #     raise Exception(f"Erro ao preencher destino: {e}")
#     except TimeoutException as e:
#         print("Erro desconhecido ao preencher destino:", e)
#         raise ReiniciarProcessoException("Erro desconhecido ao preencher destino") from e
        

#     # Data estimada
#     try:
#         print("Insere data estimada")
#         data_formatada = calcular_data_entrega(dados["local_origem"], dados["local_destino"])
#         print("Previsão de entrega:", data_formatada)


        
#         # Espera até que o campo esteja visível e habilitado
#         campo_data_entrega = WebDriverWait(driver, 15).until(
#             EC.element_to_be_clickable((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtPrevisaoChegada_dateInput"))
#         )

#         # Garante que o campo está realmente interativo
#         campo_data_entrega.click()
#         time.sleep(1)
#         print("Data formatada")
#         print(data_formatada)
#         campo_data_entrega.send_keys(data_formatada)
#         time.sleep(1)
#         campo_data_entrega.send_keys(Keys.TAB)


#     except Exception as e:
#         print("Erro ao preencher campo de data estimada:", e)
#         raise Exception(f"Erro ao preencher campo de data estimada:", e)
#     time.sleep(0.5)

#     try:

#         print("Insere tipo do ponto")
#         campo_tipo_do_ponto = driver.find_element(By.ID, "cmbTipoPontoSMP_Input")
#         campo_tipo_do_ponto.send_keys("ENTREGA")    
#         campo_tipo_do_ponto.send_keys(Keys.ENTER)

#     except Exception as e:

#         print("Erro ao preencher o campo tipo do ponto:", e)
#         raise Exception(f"Erro ao preencher o campo tipo do ponto:", e)
    
#     try:

#         time.sleep(1)
#         print("Salva destinatário")
#         # Espera até que o botão esteja clicável
#         botao_salvar_destinatario = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_btnSalvarPontoSMP")))
#         botao_salvar_destinatario.click()
#     except Exception as e:
#         print("Erro ao salvar o destinatário:", e)
#         raise Exception(f"Erro ao salvar o destinatário:", e)
    
#     try:
#         # Verifica se o destinatário foi informado antes de adicionar projeto
#         WebDriverWait(driver, 15).until(
#             EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00__1"))
#         )
#         time.sleep(0.5)

#         # Expande o ponto
#         try:
#             botao_extender_ponto = driver.find_element(
#                 By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl07_GECBtnExpandColumn"
#             )
#         except NoSuchElementException:
#             raise Exception("Destinatário não cadastrado")

#         botao_extender_ponto.click()

#         print("Adiciona projeto")

#         # Clicar no botão adicionar projeto com tentativa
#         for tentativa in range(3):
#             try:
#                 botao_adicionar_projeto = WebDriverWait(driver, 15).until(
#                     EC.element_to_be_clickable((
#                         By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl00_InitInsertButton"
#                     ))
#                 )
#                 botao_adicionar_projeto.click()
#                 break
#             except (StaleElementReferenceException, TimeoutException) as e:
#                 print(f"Tentativa {tentativa+1} de clicar no botão adicionar projeto falhou: {e}")
#                 time.sleep(1)
#         else:
#             raise ReiniciarProcessoException("Não foi possível clicar no botão de adicionar projeto.")

#         time.sleep(0.5)

#         # Preencher tipo de projeto
#         for tentativa in range(3):
#             try:
#                 campo_tipo_projeto = WebDriverWait(driver, 15).until(
#                     EC.element_to_be_clickable((
#                         By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input"
#                     ))
#                 )
#                 campo_tipo_projeto.send_keys("DELLMAR - ESPECIFICAS")
#                 time.sleep(0.5)
#                 campo_tipo_projeto.send_keys(Keys.ENTER)
#                 time.sleep(0.5)
#                 break
#             except (StaleElementReferenceException, TimeoutException) as e:
#                 print(f"Tentativa {tentativa+1} de preencher tipo de projeto falhou: {e}")
#                 time.sleep(1)
#         else:
#             raise ReiniciarProcessoException("Falha ao preencher o tipo de projeto.")

#         # Tipo de carga
#         for tentativa in range(3):
#             try:
#                 campo_tipo_carga = driver.find_element(
#                     By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbTipoCarga_Input"
#                 )
#                 campo_tipo_carga.send_keys("DIVERSOS")
#                 time.sleep(0.5)
#                 campo_tipo_carga.send_keys(Keys.ENTER)
#                 time.sleep(0.5)
#                 break
#             except (StaleElementReferenceException, TimeoutException) as e:
#                 print(f"Tentativa {tentativa+1} de preencher tipo de carga falhou: {e}")
#                 time.sleep(1)
#         else:
#             raise ReiniciarProcessoException("Falha ao preencher o tipo de carga.")

#         # Valor da carga
#         for tentativa in range(3):
#             try:
#                 campo_valor_carga = driver.find_element(
#                     By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rntxtValorCarga"
#                 )
#                 valor_str = dados["valor_total_carga"]
#                 valor_float = float(valor_str.replace(",", "."))
#                 valor_formatado = f"{valor_float:,.2f}".replace(".", ",")

#                 print(valor_formatado)

#                 campo_valor_carga.clear()
#                 campo_valor_carga.send_keys(valor_formatado)
#                 time.sleep(0.5)
#                 campo_valor_carga.send_keys(Keys.TAB)
#                 time.sleep(0.5)
#                 break
#             except (StaleElementReferenceException, TimeoutException) as e:
#                 print(f"Tentativa {tentativa+1} de preencher valor da carga falhou: {e}")
#                 time.sleep(1)
#         else:
#             raise ReiniciarProcessoException("Falha ao preencher o valor da carga.")

#         # Clicar no botão salvar projeto
#         for tentativa in range(3):
#             try:
#                 botao_salvar_projeto = WebDriverWait(driver, 10).until(
#                     EC.element_to_be_clickable((
#                         By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_btnSalvarProjeto"
#                     ))
#                 )
#                 botao_salvar_projeto.click()
#                 break
#             except StaleElementReferenceException as e:
#                 print(f"Tentativa {tentativa+1} de clicar em salvar projeto falhou por stale: {e}")
#                 time.sleep(1)
#         else:
#             raise ReiniciarProcessoException("Não foi possível clicar no botão de salvar projeto.")

#     except TimeoutException as e:
#         print("Erro de timeout ao preencher projeto:", e)
#         raise ReiniciarProcessoException("Erro de timeout ao preencher projeto") from e


#     time.sleep(2)

#         # Preencher Transportadora
#     campo_transportadora = driver.find_element(By.ID, "ctl00_MainContent_txtEmitenteTransportadora_Input")
#     campo_transportadora.send_keys("DELLMAR TRANSPORTES")  # Exemplo fixo, pode vir de dados
#     campo_transportadora.send_keys(Keys.ENTER)

#     # Preencher Campo Tipo operação
#     campo_tipo_operação = driver.find_element(By.ID, "ctl00_MainContent_cmbTipoOperacao_Input")
#     campo_tipo_operação.send_keys("TRAN")  # Exemplo fixo, pode vir de dados
#     campo_tipo_operação.send_keys(Keys.ENTER)
    
#     # Preencher horário de inicio com o horário atual
#     botao_horário_inicio = driver.find_element(By.ID, "MainContent_btnAdicionarHorario")
#     botao_horário_inicio.click()
#     time.sleep(2)

#     print("Inicia preenchimento de placa")


#     print("Inicia preenchimento de placa")

#     # 🔗 Mapeamento de conversão do 5º caractere
#     NUMERO_PARA_LETRA = {
#         '0': 'A', '1': 'B', '2': 'C', '3': 'D', '4': 'E',
#         '5': 'F', '6': 'G', '7': 'H', '8': 'I', '9': 'J'
#     }
#     LETRA_PARA_NUMERO = {v: k for k, v in NUMERO_PARA_LETRA.items()}


#     def gerar_variacoes_placa(placa: str) -> list[str]:
#         """Gera variações da placa (Mercosul ⇄ Antiga)"""
#         placa = placa.strip().upper()
#         variacoes = []

#         if len(placa) == 7:
#             char = placa[4]  # 5º caractere

#             # Se for letra, tenta converter para número
#             if char in LETRA_PARA_NUMERO:
#                 convertido = LETRA_PARA_NUMERO[char]
#                 nova = placa[:4] + convertido + placa[5:]
#                 variacoes.append(nova)

#             # Se for número, tenta converter para letra
#             if char in NUMERO_PARA_LETRA:
#                 convertido = NUMERO_PARA_LETRA[char]
#                 nova = placa[:4] + convertido + placa[5:]
#                 variacoes.append(nova)

#         return variacoes


#     def limpar_campo_placa(campo):
#         time.sleep(0.5)
#         campo.clear()
#         time.sleep(0.5)
#         campo.clear()
#         time.sleep(0.5)


#     def preencher_placa_e_confirmar(placa_texto: str):
#         placa = driver.find_element(By.ID, "txtVeiculo_Input")
#         placa.clear()
#         placa.send_keys(placa_texto)

#         try:
#             WebDriverWait(driver, 10).until(
#                 lambda d: any(
#                     ul.find_elements(By.TAG_NAME, "li")
#                     for ul in d.find_elements(By.CSS_SELECTOR, "div.RadAutoCompleteBoxPopup ul.racList")
#                     if ul.is_displayed()
#                 )
#             )
#         except TimeoutException:
#             raise Exception("A lista de sugestões de placas não carregou a tempo.")

#         placa.send_keys(Keys.TAB)

#         try:
#             WebDriverWait(driver, 10).until(
#                 EC.presence_of_element_located((By.CSS_SELECTOR, "span.racTextToken"))
#             )
#         except TimeoutException:
#             raise Exception("A placa não foi reconhecida após pressionar TAB.")

#         spans = driver.find_elements(By.CSS_SELECTOR, "span.racTextToken")
#         placas_encontradas = [span.text.strip().upper() for span in spans]

#         if not any(p.startswith(placa_texto) for p in placas_encontradas):
#             raise Exception(f"Placa '{placa_texto}' não encontrada no sistema.")

#         botao_confirmar_placa = driver.find_element(By.ID, "ctl00_MainContent_btnVinculoVeiculo")
#         botao_confirmar_placa.click()


#     def tentar_preencher_placa(placa_texto: str, max_tentativas=3):
#         # 🔸 Primeiro tenta exatamente a placa informada
#         for tentativa in range(1, max_tentativas + 1):
#             try:
#                 campo_placa = driver.find_element(By.ID, "txtVeiculo_Input")
#                 limpar_campo_placa(campo_placa)

#                 preencher_placa_e_confirmar(placa_texto)

#                 WebDriverWait(driver, 10).until(
#                     EC.presence_of_element_located((By.ID, "ctl00_MainContent_grdViewVeiculo_ctl00__0"))
#                 )

#                 print(f"✅ Placa '{placa_texto}' inserida com sucesso na tentativa {tentativa}.")
#                 return  # sucesso!

#             except Exception as e:
#                 print(f"⚠️ Tentativa {tentativa} falhou para a placa '{placa_texto}': {e}")
#                 if tentativa == max_tentativas:
#                     print(f"❌ Todas as tentativas falharam para a placa '{placa_texto}'")
#                 else:
#                     time.sleep(1)

#         # 🔸 Se falhou com a placa original, tenta variações
#         variacoes = gerar_variacoes_placa(placa_texto)

#         for variacao in variacoes:
#             for tentativa in range(1, max_tentativas + 1):
#                 try:
#                     campo_placa = driver.find_element(By.ID, "txtVeiculo_Input")
#                     limpar_campo_placa(campo_placa)

#                     preencher_placa_e_confirmar(variacao)

#                     WebDriverWait(driver, 10).until(
#                         EC.presence_of_element_located((By.ID, "ctl00_MainContent_grdViewVeiculo_ctl00__0"))
#                     )

#                     print(f"✅ Variação da placa '{variacao}' inserida com sucesso na tentativa {tentativa}.")
#                     return  # sucesso!

#                 except Exception as e:
#                     print(f"⚠️ Tentativa {tentativa} falhou para a variação '{variacao}': {e}")
#                     if tentativa == max_tentativas:
#                         print(f"❌ Todas as tentativas falharam para a variação '{variacao}'")
#                     else:
#                         time.sleep(1)

#         raise Exception(f"Nenhuma variação da placa '{placa_texto}' foi aceita após {max_tentativas} tentativas por variação.")


#     # 🔥 Processo principal
#     try:
#         print("🚚 Inserindo placa cavalo")
#         tentar_preencher_placa(dados.get("placa_cavalo", ""))

#         time.sleep(0.5)

#         print("🛻 Inserindo placa carreta")
#         if dados.get("placa_carreta_1") and dados["placa_carreta_1"].strip():
#             tentar_preencher_placa(dados["placa_carreta_1"])

#         time.sleep(0.5)

#         print("🚛 Inserindo placa carreta 2")
#         if dados.get("placa_carreta_2") and dados["placa_carreta_2"].strip():
#             tentar_preencher_placa(dados["placa_carreta_2"])

#     except Exception as e:
#         print("❌ Erro ao preencher as placas:", e)
#         raise














#     time.sleep(2)
#     # Seleção da rota
#     print("Adicionando rota")
#     botao_rota_existente = driver.find_element(By.ID, "MainContent_rblTipoRota_1")
#     botao_rota_existente.click()
#     time.sleep(0.5)
#     # Espera até que o botão "rota cliente" esteja clicável
#     try:
#         botao_rota_cliente = WebDriverWait(driver, 10).until(
#             EC.element_to_be_clickable((By.ID, "MainContent_rblRotaExistente_0"))
#         )
#         botao_rota_cliente.click()
#     except TimeoutException:
#         raise Exception("O botão 'Rota Cliente' não ficou disponível a tempo.")

#     time.sleep(0.5)

#     try:
#         campo_rota = WebDriverWait(driver, 10).until(
#             EC.element_to_be_clickable((By.ID, "ctl00_MainContent_rcbRota_Input"))
#         )
#         campo_rota.click()

#         # Espera até que as rotas estejam visíveis
#         WebDriverWait(driver, 15).until(
#             EC.presence_of_all_elements_located((By.CSS_SELECTOR, "ul.rcbList li"))
#         )

#         time.sleep(1)  # Pequeno delay para garantir que todas as opções renderizem

#         # Captura todas as rotas visíveis no dropdown
#         rotas_elementos = driver.find_elements(By.CSS_SELECTOR, "ul.rcbList li")
#         rotas_disponiveis = [rota.text.strip() for rota in rotas_elementos if rota.text.strip()]

#         if not rotas_disponiveis:
#             raise Exception("Nenhuma rota disponível foi encontrada.")

#         # Seleciona a primeira rota da lista
#         # Re-obtenha o campo antes de usar send_keys, pois ele pode ter sido "atualizado" pelo JS
#         campo_rota = driver.find_element(By.ID, "ctl00_MainContent_rcbRota_Input")
#         campo_rota.send_keys(Keys.DOWN)
#         campo_rota.send_keys(Keys.ENTER)
#         time.sleep(2)

#         # Captura o valor selecionado no campo de rota
#         campo_rota = driver.find_element(By.ID, "ctl00_MainContent_rcbRota_Input")

#         rota_selecionada = campo_rota.get_attribute("value").strip()
#         print("Rota selecionada:", rota_selecionada)

#         # Você poderá depois armazenar essa variável no banco de dados
#         dados["rota_selecionada"] = rota_selecionada

#         # Armazena todas as rotas no seu dicionário para atualizar depois
#         dados["rotas_cadastradas_apisul"] = rotas_disponiveis
#         print("Rotas disponíveis:", rotas_disponiveis)


#     except Exception as e:
#         print("❌ Erro ao selecionar rota:", e)
#         raise Exception(f"Erro ao selecionar rota: {e}")
            
#     try:

#         print("Incluindo motorista")
#         botao_incluir_motorista = driver.find_element(By.ID, "ctl00_MainContent_btnVinculaMotorista")
#         botao_incluir_motorista.click()
#         time.sleep(1)

#         botao_tipo_documento = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_tipoDeDocumento_rcbTipoDocumento_Input")
#         botao_tipo_documento.send_keys("CPF")    
#         botao_tipo_documento.send_keys(Keys.ENTER)
#         time.sleep(1)

#         campo_cpf_condutor = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_tipoDeDocumento_txtDocumento")
#         campo_cpf_condutor.click()
#         time.sleep(0.5)
#         campo_cpf_condutor.clear()
#         time.sleep(0.5)
#         campo_cpf_condutor.send_keys(dados["cpf_condutor"])

#         time.sleep(0.5)

#         botao_pesquisar_condutor = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_btnPesquisarMotorista")
#         botao_pesquisar_condutor.click()
#         time.sleep(3)

#         try:
#             botao_adicionar_condutor = WebDriverWait(driver, 10).until(
#                 EC.element_to_be_clickable((By.ID, "ctl00_MainContent_modalPopupMotorista_C_grdViewMotoristaConsulta_ctl00_ctl04_btnSalvarMotoristaPrevia"))
#             )

#             botao_adicionar_condutor.click()
#         except Exception:
#             raise Exception("Condutor não cadastrado na apisul")
        
#         # Espera aparecer a linha da tabela com o condutor inserido
#         try:
#             WebDriverWait(driver, 10).until(
#                 EC.presence_of_element_located((By.ID, "ctl00_MainContent_modalPopupMotorista_C_grdViewMotoristaPrevia_ctl00__0"))
#             )
#         except Exception:
#             raise Exception("❌ A linha com o condutor não apareceu. O cadastro pode ter falhado.")


#         try:
#             print("Salvando dados do motorista")
#             botao_confirma_condutor = WebDriverWait(driver, 10).until(
#                 EC.element_to_be_clickable((By.ID, "ctl00_MainContent_modalPopupMotorista_C_btnSalvarMotorista"))
#             )
#             botao_confirma_condutor.click()
#             time.sleep(3)
#         except Exception:
#             raise Exception("❌ Erro ao clicar no botão de confirmar condutor.")

#     except Exception as e:
#         print("Erro ao inserir o condutor:", e)
#         raise Exception(f"Erroa ao inserir o condutor:", e)
    



#     def clicar_com_seguranca(driver, by, valor, timeout=10, scroll=True, tentativas=3, delay_entre_tentativas=1.5):
#         ultima_excecao = None

#         for tentativa in range(tentativas):
#             try:
#                 print(f"🖱️ Tentando clicar no elemento: {valor} (tentativa {tentativa + 1})")

#                 elemento = WebDriverWait(driver, timeout).until(
#                     EC.element_to_be_clickable((by, valor))
#                 )

#                 if scroll:
#                     driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
#                     time.sleep(0.3)

#                 try:
#                     elemento.click()
#                 except ElementNotInteractableException:
#                     driver.execute_script("arguments[0].click();", elemento)

#                 print(f"✅ Clique bem-sucedido no elemento: {valor}")
#                 return  # sucesso, sai da função

#             except Exception as e:
#                 ultima_excecao = e
#                 print(f"⚠️ Falha ao clicar no elemento: {valor} (tentativa {tentativa + 1})")
#                 time.sleep(delay_entre_tentativas)

#         # Se chegou aqui, todas as tentativas falharam
#         raise Exception(f"❌ Falha ao clicar no elemento '{valor}' após {tentativas} tentativas. Último erro: {ultima_excecao}")


#     try:
#         clicar_com_seguranca(driver, By.ID, "ctl00_MainContent_btnNovo")

#         timeout = 40
#         start_time = time.time()

#         sm_numero = None
#         notificacao_texto = None
#         erro_detectado = False

#         try:
#             notificacao_antes = driver.find_element(By.ID, "notifTexto").text.strip()
#         except:
#             notificacao_antes = ""

#         while time.time() - start_time < timeout:
#             time.sleep(0.4)  # Polling rápido

#             # 1️⃣ Verifica se número da SMP apareceu no label
#             try:
#                 sm_label = driver.find_element(By.ID, "ctl00_MainContent_lblNumeroSM")
#                 if sm_label.is_displayed() and sm_label.text.strip():
#                     sm_numero = sm_label.text.strip()
#                     print(f"✅ SMP detectada pelo label: {sm_numero}")
#                     dados["numero_smp"] = sm_numero
#                     break
#             except:
#                 pass

#             # 2️⃣ Verifica Notificação Toast
#             try:
#                 div_notificacao = driver.find_element(By.ID, "divNotificacao")
#                 if div_notificacao.is_displayed():
#                     notif_text = driver.find_element(By.ID, "notifTexto").text.strip()

#                     if notif_text and notif_text != notificacao_antes:
#                         print(f"📢 Notificação: {notif_text}")
#                         notificacao_texto = notif_text

#                         try:
#                             driver.find_element(By.ID, "btnCloseNotificacao").click()
#                         except:
#                             pass

#                         if "foi salva com sucesso" in notif_text.lower():
#                             try:
#                                 sm_numero = notif_text.split("número ")[-1].split(" ")[0].strip()
#                                 print(f"✅ SMP criada com sucesso pela notificação: {sm_numero}")
#                                 dados["numero_smp"] = sm_numero
#                                 break
#                             except:
#                                 print("⚠️ Notificação positiva, mas não consegui extrair o número.")
#                         else:
#                             erro_detectado = True
#                             break
#             except:
#                 pass

#             # 3️⃣ Alertas PGV
#             try:
#                 alertas = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radalert")
#                 for alerta in alertas:
#                     if alerta.is_displayed():
#                         alerta_texto = alerta.text.strip()
#                         print(f"⚠️ Alerta PGV: {alerta_texto}")

#                         try:
#                             ok_btn = alerta.find_element(By.CLASS_NAME, "rwPopupButton")
#                             ok_btn.click()
#                         except:
#                             pass

#                         # Avalia se é um erro ou só um alerta informativo
#                         if any(palavra in alerta_texto.lower() for palavra in ["erro", "não foi possível", "falha"]):
#                             erro_detectado = True
#                             notificacao_texto = alerta_texto
#                         else:
#                             print(f"ℹ️ Alerta informativo ignorado: {alerta_texto}")

#                         break
#             except:
#                 pass

#             # 4️⃣ Confirmações radconfirm
#             try:
#                 confirmacoes = driver.find_elements(By.CSS_SELECTOR, ".rwDialogPopup.radconfirm")
#                 for confirm in confirmacoes:
#                     if confirm.is_displayed():
#                         texto_confirm = confirm.text.strip()
#                         print(f"❓ Confirmação detectada: {texto_confirm}")

#                         try:
#                             ok_btns = confirm.find_elements(By.CLASS_NAME, "rwPopupButton")
#                             for btn in ok_btns:
#                                 if "OK" in btn.text.upper():
#                                     btn.click()
#                                     print("✅ Clique no botão OK da confirmação.")
#                                     break
#                         except Exception as e:
#                             print("⚠️ Erro ao clicar em OK na confirmação:", e)

#                         break
#             except:
#                 pass

#         # 🔥 🔥 🔥 Verifica resultado final 🔥 🔥 🔥

#         if sm_numero:
#             print(f"🎉 SMP criada com sucesso: {sm_numero}")
#             # Retorna ou segue o fluxo normalmente
#         else:
#             # Só lança erro se não houver SMP criada
#             if erro_detectado:
#                 raise Exception(f"❌ Erro ao salvar SMP: {notificacao_texto or 'erro não especificado'}")
#             else:
#                 raise Exception("⏱️ Timeout: Nenhuma resposta ao tentar salvar SMP.")

#     except Exception as e:
#         print("❌ Erro final ao salvar SMP:", e)
#         raise


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
    

    def selecionar_item_telerik(driver, input_id, texto_alvo, timeout=15):
        """
        Seleciona um item em um RadComboBox do Telerik usando clique + XPath robusto.
        Compatível com o novo comportamento do Apisul.
        """
        print(f"[Telerik] Selecionando '{texto_alvo}' no {input_id}...")

        # 1) localizar input e abrir dropdown
        campo = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.ID, input_id))
        )

        # ⚠️ IMPORTANTE: scroll + click porque o Telerik está bloqueando inputs off-screen
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", campo)
        time.sleep(0.2)

        try:
            campo.click()
        except:
            driver.execute_script("arguments[0].click();", campo)

        time.sleep(0.4)

        # 2) tentar encontrar item por texto completo
        xpath_full = f"//li[contains(@class,'rcbItem') and contains(normalize-space(.), '{texto_alvo}')]"

        try:
            opcao = WebDriverWait(driver, timeout).until(
                EC.element_to_be_clickable((By.XPATH, xpath_full))
            )
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", opcao)
            opcao.click()
            time.sleep(0.3)
            print(f"✔ Selecionado (full match): {texto_alvo}")
            return
        except Exception:
            pass

        # 3) tentar por substring (útil quando elemento está truncado, ex: 'TRANSF...')
        texto_parcial = texto_alvo[:6]  # primeiros 6 caracteres
        xpath_partial = f"//li[contains(@class,'rcbItem') and contains(normalize-space(.), '{texto_parcial}')]"

        try:
            opcao = WebDriverWait(driver, timeout).until(
                EC.element_to_be_clickable((By.XPATH, xpath_partial))
            )
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", opcao)
            opcao.click()
            time.sleep(0.3)
            print(f"✔ Selecionado (substring match): {texto_parcial}")
            return
        except Exception:
            pass

        # 4) fallback final: iterar todos os itens e clicar no que contém o texto
        itens = driver.find_elements(By.XPATH, "//li[contains(@class,'rcbItem')]")
        for item in itens:
            txt = item.text.strip().upper()
            if texto_alvo.upper() in txt or texto_parcial.upper() in txt:
                try:
                    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", item)
                    item.click()
                    time.sleep(0.3)
                    print(f"✔ Selecionado (fallback manual): {txt}")
                    return
                except:
                    continue

        raise Exception(f"Não encontrei item '{texto_alvo}' no combo {input_id}")


    
    # ---------- ADICIONAR PROJETO ----------
    try:
        print("Expandindo ponto para adicionar projeto")

        # Quando o grid atualiza, TODOS os elementos ficam stale.
        # Então sempre buscamos tudo do zero, SEM reusar nenhum elemento anterior.

        def expandir_linha_projeto():
            # Espera a linha da grid existir (linha index 1)
            _wait(driver, 15).until(
                EC.presence_of_element_located((By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00__1"))
            )
            time.sleep(0.3)

            # Sempre buscar botão expandir fresh
            expand_btn = safe_find(
                driver,
                By.ID,
                "ctl00_MainContent_gridPontosVinculados_ctl00_ctl07_GECBtnExpandColumn",
                timeout=10
            )

            # SCROLL + CLICK
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", expand_btn)
            time.sleep(0.2)

            try:
                expand_btn.click()
            except Exception:
                driver.execute_script("arguments[0].click();", expand_btn)

            time.sleep(1.0)  # Telrik demora para expandir e renderizar detalhes

        # Retry anti-stale para expandir
        for tentativa in range(1, 4):
            try:
                expandir_linha_projeto()
                break
            except StaleElementReferenceException:
                print(f"⚠ STALE ao expandir — retry {tentativa}")
                time.sleep(0.8)
            except Exception as e:
                if tentativa == 3:
                    raise Exception(f"Falha ao expandir linha do projeto: {e}")
                print(f"⚠ Erro ao expandir linha (tentativa {tentativa}): {e}")
                time.sleep(0.8)

        # 🔽 A partir daqui, TUDO também pode estar stale
        # por isso cada elemento é SEMPRE buscado novamente

        print("Clicando no botão adicionar projeto")
        add_btn_id = "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl00_InitInsertButton"

        for tentativa in range(1, 4):
            try:
                add_btn = safe_find(driver, By.ID, add_btn_id, timeout=12)
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", add_btn)

                try:
                    add_btn.click()
                except:
                    driver.execute_script("arguments[0].click();", add_btn)

                time.sleep(1.0)  # permite o Telerik carregar campos
                break
            except StaleElementReferenceException:
                print(f"⚠ STALE no botão adicionar projeto — retry {tentativa}")
                time.sleep(0.8)
            except Exception as e:
                if tentativa == 3:
                    raise Exception(f"Falha ao clicar em adicionar projeto: {e}")
                print(f"⚠ Erro ao clicar no botão adicionar projeto (tentativa {tentativa}): {e}")
                time.sleep(0.8)

        # ---------- TIPO PROJETO ----------
        campo_tipo_projeto = safe_find(driver,
            By.ID,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input",
            timeout=12
        )
        selecionar_item_telerik(driver, 
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input",
            "DELLMAR - ESPECIFICAS"
        )

        # ---------- TIPO CARGA ----------
        selecionar_item_telerik(driver,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbTipoCarga_Input",
            "DIVERSOS"
        )

        # ---------- VALOR CARGA ----------
        campo_valor = safe_find(driver,
            By.ID,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rntxtValorCarga",
            timeout=10
        )
        valor_formatado = format_valor_string(dados.get("valor_total_carga", "") or "0")
        campo_valor.clear()
        send_keys_with_wait(driver, campo_valor, valor_formatado)
        campo_valor.send_keys(Keys.TAB)
        time.sleep(0.4)

        # ---------- SALVAR PROJETO ----------
        btn_salvar = safe_find(driver,
            By.ID,
            "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_btnSalvarProjeto",
            timeout=12
        )

        try:
            btn_salvar.click()
        except:
            driver.execute_script("arguments[0].click();", btn_salvar)

        time.sleep(1.4)

    except Exception as e:
        raise Exception(f"Erro ao adicionar projeto: {e}") from e








    time.sleep(1.0)

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
