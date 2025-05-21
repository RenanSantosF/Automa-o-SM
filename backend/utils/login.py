# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium import webdriver
# from selenium.webdriver.common.by import By
# from selenium.common.exceptions import NoSuchElementException, WebDriverException
# from selenium.webdriver.chrome.service import Service
# from webdriver_manager.chrome import ChromeDriverManager
# import tempfile
# import os
# import shutil
# import time

# def login_apisul(usuario, senha):
#     temp_user_data_dir = tempfile.mkdtemp()
    
#     try:
#         options = webdriver.ChromeOptions()
#         options.add_argument("--headless")
#         options.add_argument("--disable-gpu")
#         options.add_argument("--no-sandbox")
#         options.add_argument("--disable-dev-shm-usage")
#         options.add_argument("--disable-software-rasterizer")
#         options.add_argument("--remote-debugging-port=9222")
#         options.add_argument("--window-size=1920,1080")
#         options.add_argument(f"--user-data-dir={temp_user_data_dir}")

#         driver = webdriver.Chrome(
#             service=Service(ChromeDriverManager().install()),
#             options=options
#         )

#         driver.get("https://novoapisullog.apisul.com.br/Login")
#         WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "txtUsuario")))

#         time.sleep(2)

#         campo_usuario = driver.find_element(By.ID, "txtUsuario")
#         campo_senha = driver.find_element(By.ID, "txtSenha")

#         campo_usuario.send_keys(usuario)
#         campo_senha.send_keys(senha)

#         # Verificar se o conteúdo foi realmente inserido
#         print(f"Usuário inserido: {campo_usuario.get_attribute('value')}")
#         print(f"Senha inserida: {campo_senha.get_attribute('value')}")

#         botao_login = driver.find_element(By.ID, "btnLogin")
#         botao_login.click()

#         print("logado")

#         time.sleep(10)

#         if "Login" in driver.title or driver.current_url.endswith("/Login"):
#             driver.quit()
#             raise Exception("Falha no login: verifique o usuário e senha")

#         return driver

#     except WebDriverException as e:
#         raise Exception(f"Erro ao iniciar o navegador: {str(e)}")
#     except Exception as e:
#         raise Exception(f"Erro durante login: {str(e)}")
#     finally:
#         if os.path.exists(temp_user_data_dir):
#             shutil.rmtree(temp_user_data_dir, ignore_errors=True)


from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException, WebDriverException
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import tempfile
import os
import shutil
import time

def login_apisul(usuario, senha, max_tentativas=3):
    tentativa = 0
    while tentativa < max_tentativas:
        temp_user_data_dir = tempfile.mkdtemp()
        driver = None
        try:
            options = webdriver.ChromeOptions()
            options.add_argument("--headless")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-software-rasterizer")
            options.add_argument("--remote-debugging-port=9222")
            options.add_argument("--window-size=1920,1080")
            options.add_argument(f"--user-data-dir={temp_user_data_dir}")

            driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=options
            )

            driver.get("https://novoapisullog.apisul.com.br/Login")
            WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "txtUsuario")))

            time.sleep(2)

            campo_usuario = driver.find_element(By.ID, "txtUsuario")
            campo_senha = driver.find_element(By.ID, "txtSenha")

            campo_usuario.clear()
            campo_senha.clear()
            campo_usuario.send_keys(usuario)
            campo_senha.send_keys(senha)

            print(f"Usuário inserido: {campo_usuario.get_attribute('value')}")
            print(f"Senha inserida: {campo_senha.get_attribute('value')}")

            botao_login = driver.find_element(By.ID, "btnLogin")
            botao_login.click()

            print(f"Tentativa {tentativa + 1}: clicou no login")

            time.sleep(10)  # Espera para carregamento da página após login

            # Verifica se caiu na página de login indicando falha no login
            if "Login" in driver.title or driver.current_url.endswith("/Login"):
                print(f"Tentativa {tentativa + 1} falhou: possível erro de usuário/senha ou carregamento ruim.")
                tentativa += 1
                driver.quit()
                # tenta novamente, até max_tentativas
            else:
                print("Login bem-sucedido")
                return driver  # login OK, retorna o driver aberto

        except WebDriverException as e:
            if driver:
                driver.quit()
            print(f"Erro no webdriver: {e}")
            tentativa += 1
        except Exception as e:
            if driver:
                driver.quit()
            print(f"Erro no login: {e}")
            tentativa += 1
        finally:
            if os.path.exists(temp_user_data_dir):
                shutil.rmtree(temp_user_data_dir, ignore_errors=True)

    # Se chegou aqui, falhou todas as tentativas
    raise Exception(f"Falha no login após {max_tentativas} tentativas. Verifique usuário/senha ou estabilidade do site.")
