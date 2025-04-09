import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from utils.calcula_distancia import calcular_data_entrega

def preencher_sm(driver, dados):
    driver.get("https://novoapisullog.apisul.com.br/SMP/0")
    time.sleep(3)


    # Clica em vincular ponto pra colocar origem
    vincular_ponto_origem = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
    vincular_ponto_origem.click()
    time.sleep(5)

    # Clica no filtro de cidade
    filtrar_cidade = driver.find_element(By.CSS_SELECTOR, '[title="Filtrar por cidade"]')
    filtrar_cidade.click()
    time.sleep(3)

    # 1. Separa cidade e estado
    cidade_estado = dados["local_origem"].split(" - ")
    cidade = cidade_estado[0].strip().upper()
    estado = cidade_estado[1].strip().upper()

    # 2. Envia apenas a cidade no input
    input_filtro_cidade = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_rcbCidadePonto_Input")
    input_filtro_cidade.clear()
    input_filtro_cidade.send_keys(cidade)
    time.sleep(4)

    # 3. Espera a lista de sugestões aparecer
    lista_itens = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "li.comboBoxListItem"))
    )
    time.sleep(4)

    # 4. Percorre os itens e verifica se cidade e estado estão presentes
    for item in lista_itens:
        texto_item = item.text.upper()
        if f"CIDADE: {cidade}" in texto_item and f"ESTADO: {estado}" in texto_item:
            item.click()
            break
    else:
        raise Exception(f"Nenhum item encontrado para {cidade} - {estado}")

    # Insere o nome do remetente no campo e salva
    time.sleep(3)
    remetente_nome = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
    remetente_nome.clear()
    remetente_nome.send_keys(dados["remetente_nome"][:7])
    time.sleep(5)
    remetente_nome.send_keys(Keys.DOWN)
    remetente_nome.send_keys(Keys.ENTER)
    time.sleep(6)
    botao_salvar_remetente = driver.find_element(By.NAME, "ctl00$MainContent$gridPontosVinculados$ctl00$ctl02$ctl02$btnSalvarPontoSMP")
    botao_salvar_remetente.click()



    time.sleep(2)
    # Clica em vincular ponto pra colocar destino
    vincular_ponto_destino = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl00_lnkPontoExistente")
    vincular_ponto_destino.click()
    time.sleep(3)

    # Clica no filtro de cidade
    filtrar_cidade = driver.find_element(By.CSS_SELECTOR, '[title="Filtrar por cidade"]')
    filtrar_cidade.click()
    time.sleep(1)

    # 1. Separa cidade e estado
    cidade_estado = dados["local_destino"].split(" - ")
    cidade_destino = cidade_estado[0].strip().upper()
    estado_destino = cidade_estado[1].strip().upper()


    # 2. Envia apenas a cidade no input
    input_filtro_cidade = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_rcbCidadePonto_Input")
    input_filtro_cidade.clear()
    input_filtro_cidade.send_keys(cidade_destino)
    time.sleep(2)


    # 3. Espera a lista de sugestões aparecer
    lista_itens = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "li.comboBoxListItem"))
    )
    time.sleep(2)

    # 4. Percorre os itens e verifica se cidade e estado estão presentes
    for item in lista_itens:
        texto_item = item.text.upper()
        if f"CIDADE: {cidade_destino}" in texto_item and f"ESTADO: {estado_destino}" in texto_item:
            item.click()
            break
    else:
        raise Exception(f"Nenhum item encontrado para {cidade_destino} - {estado_destino}")

    # Insere o nome do destinatario no campo e salva
    time.sleep(1)
    destinatario_nome = driver.find_element(By.ID, "rcbIdentificadorPonto_Input")
    destinatario_nome.clear()
    destinatario_nome.send_keys(dados["destinatario_nome"][:7])

    time.sleep(4)
    destinatario_nome.send_keys(Keys.DOWN)
    destinatario_nome.send_keys(Keys.ENTER)
    destinatario_nome.send_keys(Keys.TAB)
    time.sleep(4)

    # Tempo de permanência
    botao_tempo_permanencia = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtTempoPermanencia_dateInput")
    botao_tempo_permanencia.send_keys("1100")
    time.sleep(1)
    botao_tempo_permanencia.send_keys(Keys.ENTER)
    time.sleep(1)

    # Data estimada
    try:
        data_estimada = calcular_data_entrega(dados["local_origem"], dados["local_destino"])
        data_formatada = data_estimada.strftime("%d/%m/%Y %H:%M")
        print("Previsão de entrega:", data_formatada)

        
        campo_data_entrega = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_txtPrevisaoChegada_dateInput")
        campo_data_entrega.click()
        time.sleep(0.5)
        campo_data_entrega.clear()
        time.sleep(0.5)
        campo_data_entrega.send_keys(data_formatada)
        time.sleep(0.5)
        campo_data_entrega.send_keys(Keys.ENTER)

    except Exception as e:
        print("Erro ao preencher campo de data estimada:", e)

    time.sleep(2)

    try:
        campo_tipo_do_ponto = driver.find_element(By.ID, "cmbTipoPontoSMP_Input")
        campo_tipo_do_ponto.send_keys("ENTREGA")    
        campo_tipo_do_ponto.send_keys(Keys.ENTER)

    except Exception as e:
        print("Erro ao preencher o campo tipo do ponto:", e)


    time.sleep(2)
    botao_salvar_destinatario = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl02_ctl02_btnSalvarPontoSMP")
    botao_salvar_destinatario.click()

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
    time.sleep(1)

    campo_tipo_carga = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rcbTipoCarga_Input")
    campo_tipo_carga.send_keys("DIVERSOS")    
    campo_tipo_carga.send_keys(Keys.ENTER)
    time.sleep(1)

    campo_valor_carga = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_rntxtValorCarga")
    campo_valor_carga.send_keys(dados["valor_total_carga"])    
    time.sleep(0.5)

    botao_salvar_projeto = driver.find_element(By.ID, "ctl00_MainContent_gridPontosVinculados_ctl00_ctl09_Detail21_ctl02_ctl02_btnSalvarProjeto")
    botao_salvar_projeto.click()
    

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

    # Preencher placa cavalo
    placa = driver.find_element(By.ID, "txtVeiculo_Input")
    placa.clear()
    placa.send_keys(dados.get("placa_cavalo", ""))
    time.sleep(4)
    placa.send_keys(Keys.TAB)
    time.sleep(4)
    botao_confirmar_placa = driver.find_element(By.ID, "ctl00_MainContent_btnVinculoVeiculo")
    botao_confirmar_placa.click()
    time.sleep(5)

    # --- Placa carreta 1 ---
    if dados.get("placa_carreta_1") and dados["placa_carreta_1"].strip():
        print("renaaaaaaa")
        placa_carreta = driver.find_element(By.ID, "txtVeiculo_Input")
        placa_carreta.clear()
        placa_carreta.send_keys(dados["placa_carreta_1"])
        time.sleep(4)
        placa_carreta.send_keys(Keys.TAB)
        time.sleep(4)
        botao_confirmar_placa = driver.find_element(By.ID, "ctl00_MainContent_btnVinculoVeiculo")
        botao_confirmar_placa.click()
        time.sleep(7)

    # --- Placa carreta 2 ---
    if dados.get("placa_carreta_2") and dados["placa_carreta_2"].strip():
        print("renaumm")
        placa_carreta2 = driver.find_element(By.ID, "txtVeiculo_Input")
        placa_carreta2.clear()
        placa_carreta2.send_keys(dados["placa_carreta_2"])
        time.sleep(4)
        placa_carreta2.send_keys(Keys.TAB)
        time.sleep(4)
        botao_confirmar_placa = driver.find_element(By.ID, "ctl00_MainContent_btnVinculoVeiculo")
        botao_confirmar_placa.click()
        time.sleep(6)

    # Seleção da rota
    botao_rota_existente = driver.find_element(By.ID, "MainContent_rblTipoRota_1")
    botao_rota_existente.click()
    
    time.sleep(2)
    botao_rota_cliente = driver.find_element(By.ID, "MainContent_rblRotaExistente_0")
    botao_rota_cliente.click()

    time.sleep(2)

    try:
        campo_rota = driver.find_element(By.ID, "ctl00_MainContent_rcbRota_Input")
        campo_rota.click()
        time.sleep(3)
        campo_rota.send_keys(Keys.DOWN)
        campo_rota.send_keys(Keys.ENTER)
        time.sleep(2)

    except Exception as e:
        print("Erro ao selecionar a rota:", e)

    
    botao_salvar_SMP = driver.find_element(By.ID, "ctl00_MainContent_btnNovo")
    botao_salvar_SMP.click()




    
    
    # Repita para os outros campos...
