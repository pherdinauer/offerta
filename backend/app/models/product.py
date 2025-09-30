"""
Product and Alias models
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    ean = Column(String(13), unique=True, index=True, nullable=True)
    brand = Column(String(255), nullable=True)
    name_norm = Column(String(255), nullable=False)
    package_size_value = Column(Float, nullable=True)
    package_size_uom = Column(String(10), nullable=True)  # g, kg, ml, l
    
    # Relationships
    aliases = relationship("Alias", back_populates="product")
    line_items = relationship("LineItem", back_populates="product")
    price_events = relationship("PriceEvent", back_populates="product")

class Alias(Base):
    __tablename__ = "aliases"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    raw_name_pattern = Column(String(255), nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="aliases")
