import os
from dotenv import load_dotenv

load_dotenv()

ENV = os.getenv("ENV", "local")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

SECRET_KEY = "Merasita@1"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 1 hora


origins = [FRONTEND_URL]


