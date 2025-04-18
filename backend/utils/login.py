from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException,
    WebDriverException
)
import time

def login_apisul(usuario, senha):
    try:
        options = webdriver.ChromeOptions()
        # options.add_argument("--headless")  # opcional: remove interface gráfica
        options.add_argument("--window-size=1920,1080")
        driver = webdriver.Chrome(options=options)

        driver.get("https://novoapisullog.apisul.com.br/Login")
        time.sleep(2)

        try:
            campo_usuario = driver.find_element(By.ID, "txtUsuario")
            campo_senha = driver.find_element(By.ID, "txtSenha")
        except NoSuchElementException:
            driver.quit()
            raise Exception("Campo de login ou senha não encontrado na página")

        campo_usuario.send_keys(usuario)
        campo_senha.send_keys(senha)
        campo_senha.send_keys(Keys.RETURN)

        time.sleep(3)  # Espera redirecionar após login

        # Verifica se o login foi bem-sucedido
        if "Login" in driver.title or driver.current_url.endswith("/Login"):
            driver.quit()
            raise Exception("Falha no login: verifique o usuário e senha")

        return driver

    except WebDriverException as e:
        raise Exception(f"Erro ao iniciar o navegador: {str(e)}")
    except Exception as e:
        raise Exception(f"Erro durante login: {str(e)}")
