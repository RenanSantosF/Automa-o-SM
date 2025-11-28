
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
import tempfile
import time
import os

def login_apisul(usuario, senha, max_tentativas=3):

    # Cria diretório temporário único para o Chrome
    chrome_profile = tempfile.mkdtemp(prefix="chrome_profile_")

    tentativa = 0
    service = Service()

    while tentativa < max_tentativas:
        driver = None
        try:
            options = webdriver.ChromeOptions()

            # HEADLESS NOVO (Chrome 120+)
            options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-software-rasterizer")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_argument("--window-size=1920,1080")

            # 🔥 Cada execução usa UM perfil isolado = nunca trava
            options.add_argument(f"--user-data-dir={chrome_profile}")

            driver = webdriver.Chrome(service=service, options=options)

            driver.get("https://novoapisullog.apisul.com.br/Login")

            WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.ID, "txtUsuario"))
            )

            campo_usuario = driver.find_element(By.ID, "txtUsuario")
            campo_senha = driver.find_element(By.ID, "txtSenha")

            campo_usuario.clear()
            campo_senha.clear()
            campo_usuario.send_keys(usuario)
            campo_senha.send_keys(senha)

            driver.find_element(By.ID, "btnLogin").click()

            # Espera mudança de página
            WebDriverWait(driver, 12).until_not(
                lambda d: "Login" in d.title or d.current_url.endswith("/Login")
            )

            print(f"Login bem-sucedido na tentativa {tentativa + 1}")
            return driver  # sucesso

        except (TimeoutException, WebDriverException) as e:
            print(f"Tentativa {tentativa + 1} falhou: {e}")
            tentativa += 1
            if driver:
                driver.quit()

        except Exception as e:
            print(f"Erro inesperado: {e}")
            tentativa += 1
            if driver:
                driver.quit()

    raise Exception("Falha no login após 3 tentativas.")
