"""
Store model
"""
from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base

class Store(Base):
    __tablename__ = "stores"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    chain = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
