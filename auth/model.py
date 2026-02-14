from sqlalchemy import String, Column, DateTime
from datetime import datetime

reset_token = Column(String, nullable=True)
reset_token_expire = Column(DateTime, nullable=True)