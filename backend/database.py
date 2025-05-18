from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://automacao_db_user:89Fy8sYlhBx4grcYp80obhLPOeNvFJFr@dpg-d0kslat6ubrc73bioiig-a/automacao_db"


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
