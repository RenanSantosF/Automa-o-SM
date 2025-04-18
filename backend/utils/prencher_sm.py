import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from utils.calcula_distancia import calcular_data_entrega



def preencher_sm(driver, dados):
    driver.get("https://novoapisullog.apisul.com.br/SMP/0")
    time.sleep(3)
    

    try:
        vincular_ponto_origem = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
        vincular_ponto_origem.click()
        time.sleep(5)
    except Exception as e:

        print("Erro ao clicar em 'Vincular ponto origem':", e)
        raise Exception(f"Erro ao clicar em 'Vincular ponto origem': {e}")


    try:
        filtrar_cidade = driver.find_element(By.CSS_SELECTOR, '[title="Filtrar por cidade"]')
        filtrar_cidade.click()
        time.sleep(3)

        # 1. Separa cidade e estado
        cidade_estado = dados["local_origem"].split(" - ")
        cidade = cidade_estado[0].strip().upper()
        estado = cidade_estado[1].strip().upper()

        input_filtro_cidade = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_rcbCidadePonto_Input")
        input_filtro_cidade.clear()
        input_filtro_cidade.send_keys(cidade)
        time.sleep(4)

        lista_itens = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "li.comboBoxListItem"))
        )
        time.sleep(4)

        for item in lista_itens:
            texto_item = item.text.upper()
            if f"CIDADE: {cidade}" in texto_item and f"ESTADO: {estado}" in texto_item:
                item.click()
                break
        else:
            raise Exception(f"Nenhum item encontrado para {cidade} - {estado}")
    except Exception as e:
        print("Erro ao selecionar cidade de origem:", e)
        raise Exception(f"Erro ao selecionar cidade de origem: {e}")

    try:
        time.sleep(3)
        remetente_nome = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
        remetente_nome.clear()
        remetente_nome.send_keys(dados["remetente_nome"][:7])
        time.sleep(3)

        # Aguarda a lista de sugestões aparecer (ul.rcbList)
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "ul.rcbList"))
            )
        except:
            print("Nenhum remetente encontrado (ul.rcbList não apareceu).")
            raise Exception("Remetente não encontrado")

        # Pressiona seta pra baixo e enter
        remetente_nome.send_keys(Keys.DOWN)
        remetente_nome.send_keys(Keys.ENTER)
        time.sleep(2)

        # Rebusca o input e pega o valor preenchido
        remetente_nome = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
        nome_completo_remetente_cadastrado = remetente_nome.get_attribute("value")

        if not nome_completo_remetente_cadastrado.strip():
            raise Exception("Remetente não foi preenchido corretamente após ENTER.")

        dados["remetente_cadastrado_apisul"] = nome_completo_remetente_cadastrado
        print("Remetente cadastrado na apisul:", nome_completo_remetente_cadastrado)

        time.sleep(4)
        botao_salvar_remetente = driver.find_element(By.NAME, "ctl00$MainContent$gridPontosVinculados$ctl00$ctl02$ctl02$btnSalvarPontoSMP")
        botao_salvar_remetente.click()

    except Exception as e:
        print("Erro ao preencher remetente:", e)
        raise Exception(f"Erro ao preencher remetente: {e}", e)


    try:
        time.sleep(2)
        # Clica em vincular ponto pra colocar destino
        vincular_ponto_destino = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
        vincular_ponto_destino.click()
        time.sleep(3)

        filtrar_cidade = driver.find_element(By.CSS_SELECTOR, '[title="Filtrar por cidade"]')
        filtrar_cidade.click()
        time.sleep(2)

        cidade_estado = dados["local_destino"].split(" - ")
        cidade_destino = cidade_estado[0].strip().upper()
        estado_destino = cidade_estado[1].strip().upper()

        input_filtro_cidade = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_rcbCidadePonto_Input")
        input_filtro_cidade.clear()
        input_filtro_cidade.send_keys(cidade_destino)
        time.sleep(2)

        lista_itens = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "li.comboBoxListItem"))
        )
        time.sleep(2)

        for item in lista_itens:
            texto_item = item.text.upper()
            if f"CIDADE: {cidade_destino}" in texto_item and f"ESTADO: {estado_destino}" in texto_item:
                item.click()
                break
        else:
            print("Nenhum item encontrado para cidade destino")
            raise Exception(f"Nenhum item encontrado para {cidade_destino} - {estado_destino}")


        time.sleep(2)
        destinatario_nome = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
        destinatario_nome.clear()
        destinatario_nome.send_keys(dados["destinatario_nome"][:7])
        time.sleep(3)

        # Aguarda a lista de sugestões aparecer (ul.rcbList)
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "ul.rcbList"))
            )
        except:
            print("Nenhum remetente encontrado (ul.rcbList não apareceu).")
            raise Exception("Remetente não encontrado")

        # Tecla seta para baixo e depois ENTER
        destinatario_nome.send_keys(Keys.DOWN)
        destinatario_nome.send_keys(Keys.ENTER)
        time.sleep(2)

        # Rebuscar de novo após ENTER
        destinatario_nome = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
        nome_completo_destinatario_cadastrado = destinatario_nome.get_attribute("value")
        dados["destinatario_cadastrado_apisul"] = nome_completo_destinatario_cadastrado
        print("Destinatário cadastrado na apisul:", nome_completo_destinatario_cadastrado)

        if not nome_completo_destinatario_cadastrado.strip():
            raise Exception("Destinatário não foi preenchido corretamente após ENTER.")

        dados["destinatario_cadastrado_apisul"] = nome_completo_destinatario_cadastrado
        print("Destinatário cadastrado na apisul:", nome_completo_destinatario_cadastrado)

        time.sleep(4)
        botao_tempo_permanencia = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtTempoPermanencia_dateInput")
        botao_tempo_permanencia.send_keys("1100")
        time.sleep(1)
        botao_tempo_permanencia.send_keys(Keys.ENTER)
        time.sleep(1)
    except Exception as e:
        print("Erro ao preencher destino:", e)
        raise Exception(f"Erro ao preencher destino:", e)
        

    # Data estimada
    try:
        data_estimada = calcular_data_entrega(dados["local_origem"], dados["local_destino"])
        data_formatada = data_estimada.strftime("%d/%m/%Y %H:%M")
        print("Previsão de entrega:", data_formatada)

        
        campo_data_entrega = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtPrevisaoChegada_dateInput")
        campo_data_entrega.click()
        time.sleep(1)
        campo_data_entrega.clear()
        time.sleep(1)
        campo_data_entrega.send_keys(data_formatada)
        time.sleep(1)
        campo_data_entrega.send_keys(Keys.ENTER)

    except Exception as e:
        print("Erro ao preencher campo de data estimada:", e)
        raise Exception(f"Erro ao preencher campo de data estimada:", e)
    time.sleep(2)

    try:
        campo_tipo_do_ponto = driver.find_element(By.ID, "cmbTipoPontoSMP_Input")
        campo_tipo_do_ponto.send_keys("ENTREGA")    
        campo_tipo_do_ponto.send_keys(Keys.ENTER)

    except Exception as e:

        print("Erro ao preencher o campo tipo do ponto:", e)
        raise Exception(f"Erro ao preencher o campo tipo do ponto:", e)
    
    try:

        time.sleep(2)
        botao_salvar_destinatario = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_btnSalvarPontoSMP")
        botao_salvar_destinatario.click()
    except Exception as e:
        print("Erro ao salvar o destinatário:", e)
        raise Exception(f"Erro ao salvar o destinatário:", e)
    
    try:

        # Adicionar projeto
        time.sleep(3)
        botao_extender_ponto = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl07_GECBtnExpandColumn")
        botao_extender_ponto.click()

        time.sleep(1.5)
        botao_adicionar_projeto = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl00_InitInsertButton")
        botao_adicionar_projeto.click()
        time.sleep(3)

        # dados do projeto

        campo_tipo_projeto = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbProjeto_Input")
        campo_tipo_projeto.send_keys("DELLMAR - ESPECIFICAS")    
        campo_tipo_projeto.send_keys(Keys.ENTER)
        time.sleep(2)

        campo_tipo_carga = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbTipoCarga_Input")
        campo_tipo_carga.send_keys("DIVERSOS")    
        campo_tipo_carga.send_keys(Keys.ENTER)
        time.sleep(2)

        campo_valor_carga = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rntxtValorCarga")
        valor_str = dados["valor_total_carga"]
        # Garante que é um número float válido mesmo se vier com vírgula
        valor_float = float(valor_str.replace(",", "."))

        # Agora formata no padrão do site (com vírgula como separador decimal)
        valor_formatado = f"{valor_float:,.2f}".replace(".", ",")
        print(valor_formatado)

        campo_valor_carga.clear()
        campo_valor_carga.send_keys(valor_formatado)
        time.sleep(1)

        botao_salvar_projeto = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_btnSalvarProjeto")
        botao_salvar_projeto.click()
    except Exception as e:
        print("Erro ao salvar o projeto:", e)
        raise Exception(f"Erro ao salvar o projeto:", e)

    time.sleep(2)

        # Preencher Transportadora
    campo_transportadora = driver.find_element(By.ID, "ctl00_MainContent_txtEmitenteTransportadora_Input")
    campo_transportadora.send_keys("DELLMAR TRANSPORTES")  # Exemplo fixo, pode vir de dados

    # Preencher Campo Tipo operação
    campo_tipo_operação = driver.find_element(By.ID, "ctl00_MainContent_cmbTipoOperacao_Input")
    campo_tipo_operação.send_keys("HIBRIDA")  # Exemplo fixo, pode vir de dados
    campo_tipo_operação.send_keys(Keys.ENTER)
    
    # Preencher horário de inicio com o horário atual
    botao_horário_inicio = driver.find_element(By.ID, "MainContent_btnAdicionarHorario")
    botao_horário_inicio.click()
    time.sleep(2)



    def preencher_placa_e_confirmar(placa_texto: str):
        placa = driver.find_element(By.ID, "txtVeiculo_Input")
        placa.clear()
        placa.send_keys(placa_texto)
        time.sleep(3)
        placa.send_keys(Keys.TAB)
        time.sleep(3)

        # Verifica se o span com a placa apareceu
        spans = driver.find_elements(By.CSS_SELECTOR, "span.racTextToken")
        placas_encontradas = [span.text.strip().upper() for span in spans]

        if placa_texto.strip().upper() not in placas_encontradas:
            raise Exception(f"Placa '{placa_texto}' não encontrada no sistema após o TAB.")

        # Confirmar a placa
        botao_confirmar_placa = driver.find_element(By.ID, "ctl00_MainContent_btnVinculoVeiculo")
        botao_confirmar_placa.click()
        time.sleep(4)


    try:
        # Placa cavalo
        preencher_placa_e_confirmar(dados.get("placa_cavalo", ""))

        # Carreta 1
        if dados.get("placa_carreta_1") and dados["placa_carreta_1"].strip():
            preencher_placa_e_confirmar(dados["placa_carreta_1"])

        # Carreta 2
        if dados.get("placa_carreta_2") and dados["placa_carreta_2"].strip():
            preencher_placa_e_confirmar(dados["placa_carreta_2"])

    except Exception as e:
        print("Erro ao preencher a placa da carreta", e)
        raise Exception(f"Erro ao preencher a placa da carreta", e)


    # Seleção da rota
    botao_rota_existente = driver.find_element(By.ID, "MainContent_rblTipoRota_1")
    botao_rota_existente.click()
    
    time.sleep(2)
    botao_rota_cliente = driver.find_element(By.ID, "MainContent_rblRotaExistente_0")
    botao_rota_cliente.click()

    time.sleep(2)


    try:
        campo_rota = driver.find_element(By.ID, "ctl00_MainContent_rcbRota_Input")
        seta_dropdown = driver.find_element(By.ID, "ctl00_MainContent_rcbRota_Arrow")

        # Força clique com ActionChains para não fechar o dropdown sem querer
        actions = ActionChains(driver)
        actions.move_to_element(campo_rota).click().perform()
        time.sleep(0.5)
        actions.move_to_element(seta_dropdown).click().perform()
        time.sleep(1)

        # Aguarda o ul aparecer visivelmente
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul.rcbList"))
        )

        # Tenta capturar as rotas várias vezes
        rotas_extraidas = []
        for i in range(10):  # tenta por até 5 segundos
            rotas_extraidas = driver.execute_script("""
                const lis = document.querySelectorAll('ul.rcbList li');
                return Array.from(lis).map(li => li.textContent.trim()).filter(txt => txt);
            """)
            if rotas_extraidas:
                break
            time.sleep(0.5)

        if not rotas_extraidas:
            # Faz dump do DOM para debug
            html_completo = driver.execute_script("return document.body.innerHTML")
            with open("html_dump.html", "w", encoding="utf-8") as f:
                f.write(html_completo)
            print("❌ Nenhuma rota foi capturada. HTML salvo como html_dump.html")
            raise Exception("Nenhuma rota foi capturada após aguardar.")

        print("✅ Rotas capturadas via JS:", rotas_extraidas)
        dados["rotas_cadastradas_apisul"] = rotas_extraidas

    except Exception as e:
        print("❌ Erro ao capturar as rotas:", e)
        raise Exception(f"Erro ao capturar as rotas: {e}")

        
    try:

        botao_incluir_motorista = driver.find_element(By.ID, "ctl00_MainContent_btnVinculaMotorista")
        botao_incluir_motorista.click()
        time.sleep(1)

        botao_tipo_documento = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_tipoDeDocumento_rcbTipoDocumento_Input")
        botao_tipo_documento.send_keys("CPF")    
        botao_tipo_documento.send_keys(Keys.ENTER)
        time.sleep(1)

        campo_cpf_condutor = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_tipoDeDocumento_txtDocumento")
        campo_cpf_condutor.send_keys(dados["cpf_condutor"])
        time.sleep(0.5)

        botao_pesquisar_condutor = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_btnPesquisarMotorista")
        botao_pesquisar_condutor.click()
        time.sleep(3)

        try:
            botao_adicionar_condutor = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "ctl00_MainContent_modalPopupMotorista_C_grdViewMotoristaConsulta_ctl00_ctl04_btnSalvarMotoristaPrevia"))
            )
            botao_adicionar_condutor.click()
        except Exception:
            raise Exception("Condutor não cadastrado na apisul")
        
        time.sleep(3)
        botao_confirma_condutor = driver.find_element(By.ID, "ctl00_MainContent_modalPopupMotorista_C_btnSalvarMotorista")
        botao_confirma_condutor.click()
        time.sleep(3)

        print("todos os dados")
        print(dados)

    except Exception as e:
        print("Erro ao inserir o condutor:", e)
        raise Exception(f"Erroa ao inserir o condutor:", e)
    
    try:
        botao_salvar_SMP = driver.find_element(By.ID, "ctl00_MainContent_btnNovo")
        botao_salvar_SMP.click()
    except Exception as e:
        print("erro ao salvar SM:")
        raise Exception(f"erro ao salvar SM:", e)
    
    return