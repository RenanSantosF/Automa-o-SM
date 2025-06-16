# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium import webdriver
# from selenium.webdriver.common.by import By
# from selenium.common.exceptions import NoSuchElementException, WebDriverException, TimeoutException
# from selenium.webdriver.chrome.service import Service
# from webdriver_manager.chrome import ChromeDriverManager
# import tempfile
# import os
# import shutil
# import time

# def login_apisul(usuario, senha, max_tentativas=3):
#     tentativa = 0
#     while tentativa < max_tentativas:
#         temp_user_data_dir = tempfile.mkdtemp()
#         driver = None
#         try:
#             options = webdriver.ChromeOptions()
#             # options.add_argument("--headless=new")
#             options.add_argument("--disable-gpu")
#             options.add_argument("--no-sandbox")
#             options.add_argument("--disable-dev-shm-usage")
#             options.add_argument("--disable-software-rasterizer")
#             options.add_argument("--remote-debugging-port=9222")
#             options.add_argument("--window-size=1920,1080")
#             options.add_argument(f"--user-data-dir={temp_user_data_dir}")

#             driver = webdriver.Chrome(
#                 service=Service(ChromeDriverManager().install()),
#                 options=options
#             )

#             driver.get("https://novoapisullog.apisul.com.br/Login")

#             WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, "txtUsuario")))

#             campo_usuario = driver.find_element(By.ID, "txtUsuario")
#             campo_senha = driver.find_element(By.ID, "txtSenha")

#             campo_usuario.clear()
#             campo_senha.clear()
#             campo_usuario.send_keys(usuario)
#             campo_senha.send_keys(senha)

#             print(f"Usuário inserido: {campo_usuario.get_attribute('value')}")
#             print(f"Senha inserida: {campo_senha.get_attribute('value')}")

#             botao_login = driver.find_element(By.ID, "btnLogin")
#             botao_login.click()

#             print(f"Tentativa {tentativa + 1}: clicou no login")

#             # Aguarda até sair da página de login OU timeout
#             WebDriverWait(driver, 12).until_not(
#                 lambda d: "Login" in d.title or d.current_url.endswith("/Login")
#             )

#             print("Login bem-sucedido")
#             return driver  # login OK

#         except (TimeoutException, WebDriverException) as e:
#             print(f"Tentativa {tentativa + 1} falhou: {e}")
#             tentativa += 1
#             if driver:
#                 driver.quit()
#         except Exception as e:
#             print(f"Erro inesperado: {e}")
#             tentativa += 1
#             if driver:
#                 driver.quit()
#         finally:
#             if os.path.exists(temp_user_data_dir):
#                 shutil.rmtree(temp_user_data_dir, ignore_errors=True)

#     raise Exception(f"Falha no login após {max_tentativas} tentativas. Verifique usuário/senha ou estabilidade do site.")


from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
import os
import shutil
import time

# Defina um caminho fixo para o perfil Chrome, fora do tmp
CHROME_USER_DATA_DIR = os.path.abspath("./chrome_profile")

def login_apisul(usuario, senha, max_tentativas=3):
    tentativa = 0

    # Certifique-se que a pasta existe (ou crie uma vez na inicialização do programa)
    os.makedirs(CHROME_USER_DATA_DIR, exist_ok=True)

    # Configure o Service uma vez fora do loop, para evitar overhead de instalação repetida
    service = Service()  # Usará chrome driver padrão instalado no PATH

    while tentativa < max_tentativas:
        driver = None
        try:
            options = webdriver.ChromeOptions()
            # options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-software-rasterizer")
            # Remove remote-debugging-port para mais leveza, a não ser que seja necessário
            options.add_argument("--window-size=1920,1080")

            # Usa perfil fixo pra acelerar, não cria pasta temporária a cada tentativa
            options.add_argument(f"--user-data-dir={CHROME_USER_DATA_DIR}")

            driver = webdriver.Chrome(service=service, options=options)

            driver.get("https://novoapisullog.apisul.com.br/Login")

            WebDriverWait(driver, 7).until(EC.visibility_of_element_located((By.ID, "txtUsuario")))

            campo_usuario = driver.find_element(By.ID, "txtUsuario")
            campo_senha = driver.find_element(By.ID, "txtSenha")

            campo_usuario.clear()
            campo_senha.clear()
            campo_usuario.send_keys(usuario)
            campo_senha.send_keys(senha)

            botao_login = driver.find_element(By.ID, "btnLogin")
            botao_login.click()

            # Aguarda até sair da página de login OU timeout
            WebDriverWait(driver, 10).until_not(
                lambda d: "Login" in d.title or d.current_url.endswith("/Login")
            )

            print(f"Login bem-sucedido na tentativa {tentativa + 1}")
            return driver  # login OK

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
    raise Exception(f"Falha no login após {max_tentativas} tentativas. Verifique usuário/senha ou estabilidade do site.")
