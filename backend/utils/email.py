import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

import json

def montar_assunto_corpo(execucao: dict):
    sm_numero = execucao.get("numero_smp")
    
    assunto = f"[SUCESSO] - SMP {sm_numero or 'N/A'} criada para {execucao.get('condutor') or 'Condutor não informado'}"

    valor_carga = f"R$ {execucao.get('valor_total_carga')}" if execucao.get("valor_total_carga") else "N/A"

    corpo = f"""
SMP gerada com sucesso.

Número SMP: {sm_numero or 'N/A'}

Detalhes da execução:
- Condutor: {execucao.get('condutor') or 'N/A'}
- CPF do condutor: {execucao.get('cpf_condutor') or 'N/A'}
- Placa Cavalo: {execucao.get('placa_cavalo') or 'N/A'}
- Placa Carreta 1: {execucao.get('placa_carreta_1') or 'N/A'}
- Placa Carreta 2: {execucao.get('placa_carreta_2') or 'N/A'}
- Local Origem: {execucao.get('local_origem') or 'N/A'}
- Local Destino: {execucao.get('local_destino') or 'N/A'}
- Valor Total da Carga: {valor_carga}
""".strip()

    return assunto, corpo

def enviar_email(destinatario: str, assunto: str, corpo: str):
    remetente = os.getenv("EMAIL_REMETENTE")
    senha = os.getenv("EMAIL_SENHA")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))

    msg = MIMEMultipart()
    msg['From'] = remetente
    msg['To'] = destinatario
    msg['Subject'] = assunto

    msg.attach(MIMEText(corpo, 'plain'))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(remetente, senha)
            server.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
