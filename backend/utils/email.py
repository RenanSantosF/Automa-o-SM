# import smtplib
# from email.message import EmailMessage
# import os

# def enviar_email_com_anexos(destinatario, arquivos, assunto="NF-es em XML", corpo="Segue em anexo os arquivos XML"):
#     try:
#         print(os.getenv("EMAIL_REMETENTE"))
#         print(os.getenv("EMAIL_SENHA"))
#         print(os.getenv("SMTP_SERVER"))
#         print(os.getenv("SMTP_PORT"))

#         msg = EmailMessage()
#         msg["Subject"] = assunto
#         msg["From"] = os.getenv("EMAIL_REMETENTE")
#         msg["To"] = destinatario
#         msg.set_content(corpo)

#         for caminho in arquivos:
#             with open(caminho, "rb") as f:
#                 nome = os.path.basename(caminho)
#                 msg.add_attachment(f.read(), maintype="application", subtype="xml", filename=nome)

#         with smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT"))) as smtp:
#             smtp.ehlo()
#             smtp.starttls()
#             smtp.login(os.getenv("EMAIL_REMETENTE"), os.getenv("EMAIL_SENHA"))
#             smtp.send_message(msg)


#         print(f"E-mail enviado para {destinatario} com {len(arquivos)} arquivos.")

#     except Exception as e:
#         print(f"[ERRO] Falha ao enviar e-mail: {e}")

import smtplib
from email.message import EmailMessage
import os
from typing import List, Optional

def enviar_email_com_anexos(destinatario: str, arquivos: List[str], assunto="NF-es em XML", corpo="Segue em anexo os arquivos XML", cc: Optional[str] = None):
    try:
        print(os.getenv("EMAIL_REMETENTE"))
        print(os.getenv("EMAIL_SENHA"))
        print(os.getenv("SMTP_SERVER"))
        print(os.getenv("SMTP_PORT"))

        msg = EmailMessage()
        msg["Subject"] = assunto
        msg["From"] = os.getenv("EMAIL_REMETENTE")
        msg["To"] = destinatario
        if cc:
            msg["Cc"] = cc

        msg.set_content(corpo)

        for caminho in arquivos:
            with open(caminho, "rb") as f:
                nome = os.path.basename(caminho)
                msg.add_attachment(f.read(), maintype="application", subtype="xml", filename=nome)

        with smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT"))) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(os.getenv("EMAIL_REMETENTE"), os.getenv("EMAIL_SENHA"))
            smtp.send_message(msg)

        print(f"E-mail enviado para {destinatario} com {len(arquivos)} arquivos.")
        if cc:
            print(f"Cópia enviada para {cc}")

    except Exception as e:
        print(f"[ERRO] Falha ao enviar e-mail: {e}")
