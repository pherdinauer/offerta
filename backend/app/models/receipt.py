"""
Receipt and LineItem models
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    purchased_at = Column(DateTime(timezone=True), nullable=True)
    file_key = Column(String(255), nullable=False)
    status = Column(String(20), default="queued")  # queued, processing, ready, failed, needs_review
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # OCR results
    ocr_confidence = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    currency = Column(String(3), default="EUR")
    
    # Relationships
    user = relationship("User")
    store = relationship("Store")
    line_items = relationship("LineItem", back_populates="receipt")

class LineItem(Base):
    __tablename__ = "line_items"
    
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    raw_desc = Column(Text, nullable=False)
    qty = Column(Float, default=1.0)
    price_total = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=True)
    size_value = Column(Float, nullable=True)
    size_uom = Column(String(10), nullable=True)
    
    # OCR confidence
    confidence_desc = Column(Float, nullable=True)
    confidence_price = Column(Float, nullable=True)
    
    # Relationships
    receipt = relationship("Receipt", back_populates="line_items")
    product = relationship("Product", back_populates="line_items")
