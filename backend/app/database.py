#Connect to our MSSQL DB or Databases and gives connection to everyone or aneone who needs it 

from sqlalchemy import create_engine , text 
from sqlalchemy.orm import sessionmaker
import os 
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_DATABASE")

CONNECTION_STRING =(f"mssql+pyodbc://"f"@{DB_SERVER}/{DB_NAME}"f"?driver=ODBC+Driver+17+for+SQL+Server" f"&TrustServerCertificate=yes")

engine=create_engine(
    CONNECTION_STRING,
    echo=True
)

SessionLocal=sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

