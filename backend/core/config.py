import os
from dotenv import load_dotenv

load_dotenv()

ENV = os.getenv("ENV", "local")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

origins = [FRONTEND_URL]
