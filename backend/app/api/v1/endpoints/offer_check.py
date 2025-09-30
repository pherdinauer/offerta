"""
Offer check endpoints for barcode scanning
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.product import Product
from app.services.decision_engine import DecisionEngine

router = APIRouter()

class OfferCheckResponse(BaseModel):
    product_id: Optional[int]
    unit_price: Optional[float]
    unit_price_uom: Optional[str]
    decision: str
    reasons: list[str]

@router.get("/", response_model=OfferCheckResponse)
async def check_offer(
    ean: str = Query(..., description="Product EAN code"),
    price: float = Query(..., description="Product price"),
    size: float = Query(..., description="Product size"),
    uom: str = Query(..., description="Unit of measure"),
    db: Session = Depends(get_db)
):
    """
    Check if a product is an offer based on barcode and price
    """
    try:
        # Find product by EAN
        product = db.query(Product).filter(Product.ean == ean).first()
        if not product:
            return OfferCheckResponse(
                product_id=None,
                unit_price=None,
                unit_price_uom=None,
                decision="unknown",
                reasons=["Prodotto non riconosciuto"]
            )
        
        # Calculate unit price
        unit_price = price / size if size > 0 else None
        unit_price_uom = f"€/{uom}"
        
        # Get decision from engine
        decision_engine = DecisionEngine(db)
        decision, reasons = decision_engine.get_decision(
            user_id=1,  # TODO: Get from auth
            product_id=product.id,
            unit_price=unit_price,
            unit_price_uom=unit_price_uom
        )
        
        return OfferCheckResponse(
            product_id=product.id,
            unit_price=unit_price,
            unit_price_uom=unit_price_uom,
            decision=decision,
            reasons=reasons
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check offer: {str(e)}")
