from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException, WebDriverException
import tempfile
import uuid
import os
import shutil
import time

def login_apisul(usuario, senha):
    temp_user_data_dir = None
    try:
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--remote-debugging-port=9222")
        options.add_argument("--window-size=1920,1080")

        driver = webdriver.Chrome(options=options)
        driver.get("https://novoapisullog.apisul.com.br/Login")

        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "txtUsuario")))

        time.sleep(2)



        campo_usuario = driver.find_element(By.ID, "txtUsuario")
        campo_senha = driver.find_element(By.ID, "txtSenha")

        campo_usuario.send_keys(usuario)
        campo_senha.send_keys(senha)
        time.sleep(1)
        campo_senha.send_keys(Keys.RETURN)

        print("logado")

        time.sleep(3)

        # Verificar se o conteúdo foi realmente inserido
        usuario_inserido = campo_usuario.get_attribute("value")
        senha_inserida = campo_senha.get_attribute("value")

        print(f"Usuário inserido: {usuario_inserido}")
        print(f"Senha inserida: {senha_inserida}")

        if "Login" in driver.title or driver.current_url.endswith("/Login"):
            driver.quit()
            raise Exception("Falha no login: verifique o usuário e senha")

        return driver

    except WebDriverException as e:
        raise Exception(f"Erro ao iniciar o navegador: {str(e)}")
    except Exception as e:
        raise Exception(f"Erro durante login: {str(e)}")
    finally:
        # Limpa diretório temporário DEPOIS que o navegador for fechado
        if temp_user_data_dir and os.path.exists(temp_user_data_dir):
            try:
                shutil.rmtree(temp_user_data_dir, ignore_errors=True)
            except Exception:
                pass
