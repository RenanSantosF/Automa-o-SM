from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

def login_apisul(usuario, senha):
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless")  # opcional: remove interface gráfica
    options.add_argument("--window-size=1920,1080")
    driver = webdriver.Chrome(options=options)

    driver.get("https://novoapisullog.apisul.com.br/Login")
    time.sleep(2)

    campo_usuario = driver.find_element(By.ID, "txtUsuario")
    campo_senha = driver.find_element(By.ID, "txtSenha")

    campo_usuario.send_keys(usuario)
    campo_senha.send_keys(senha)
    campo_senha.send_keys(Keys.RETURN)

    time.sleep(3)  # Espera redirecionar

    return driver
