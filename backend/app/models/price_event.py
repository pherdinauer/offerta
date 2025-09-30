"""
PriceEvent model for tracking price history
"""
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class PriceEvent(Base):
    __tablename__ = "price_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    unit_price = Column(Float, nullable=False)
    unit_price_uom = Column(String(10), nullable=False)  # €/100g, €/L
    price_per_100g_or_L = Column(Float, nullable=False)
    ts = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    product = relationship("Product", back_populates="price_events")
    store = relationship("Store")
