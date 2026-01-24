from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from os import getenv
from dotenv import load_dotenv

load_dotenv()

DATA_BASE_URL = getenv('DATA_BASE_URL')

if not DATA_BASE_URL:
    raise RuntimeError("DATA_BASE_URL is not set")

engine = create_engine(
    DATA_BASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)
Session_local = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = Session_local()
    try:
        yield db
    finally:
        db.close()