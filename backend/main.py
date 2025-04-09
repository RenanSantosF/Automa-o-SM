from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import io
import json
from login import login_apisul
from prencher_sm import preencher_sm
from utils.extract_cte import extrair_dados_do_cte

app = FastAPI()

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        content = await file.read()

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            texto_extraido = ""
            tabelas_extraidas = []
            palavras_por_pagina = []

            for page in pdf.pages:
                texto_extraido += page.extract_text() or ""
                tabelas = page.extract_tables()
                palavras = page.extract_words()  # Lista de dicts com texto + posição

                for tabela in tabelas:
                    tabelas_extraidas.append(tabela)

                palavras_por_pagina.append(palavras)

        if not texto_extraido.strip():
            return {"erro": "Não foi possível extrair texto do PDF."}

        # Envia as palavras com posição para uma extração mais inteligente
        dados = extrair_dados_do_cte(texto_extraido, tabelas_extraidas, palavras_por_pagina)

        print("Dados extraídos:")
        print(json.dumps(dados, indent=4, ensure_ascii=False))

        usuario = "dellmar.renan"
        senha = "Dellmar@1"
        driver = login_apisul(usuario, senha)
        preencher_sm(driver, dados)

        return {
            "mensagem": "Solicitação analisada com sucesso!",
            "dados": dados
        }

    except Exception as e:
        return {"erro": f"Ocorreu um erro ao processar o PDF: {str(e)}"}
