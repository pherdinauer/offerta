"""
Receipt endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.receipt import Receipt
from app.models.line_item import LineItem
from app.models.product import Product
from app.models.price_event import PriceEvent
from app.services.decision_engine import DecisionEngine

router = APIRouter()

class ReceiptRequest(BaseModel):
    file_key: str
    store_hint: Optional[str] = None
    purchased_at: Optional[datetime] = None
    client_upload_id: str

class ReceiptResponse(BaseModel):
    id: int
    status: str

class ItemResponse(BaseModel):
    product_id: Optional[int]
    name: str
    brand: Optional[str]
    size_value: Optional[float]
    size_uom: Optional[str]
    qty: float
    price_total: float
    unit_price: Optional[float]
    unit_price_uom: Optional[str]
    last_price: Optional[float]
    avg_price: Optional[float]
    decision: str
    reasons: List[str]

class ReceiptDetailResponse(BaseModel):
    id: int
    status: str
    items: List[ItemResponse]

@router.post("/", response_model=ReceiptResponse)
async def create_receipt(
    request: ReceiptRequest,
    db: Session = Depends(get_db)
):
    """
    Create receipt and queue OCR processing
    """
    try:
        # Create receipt record
        receipt = Receipt(
            user_id=1,  # TODO: Get from auth
            file_key=request.file_key,
            status="queued"
        )
        
        if request.store_hint:
            # TODO: Find or create store
            pass
            
        if request.purchased_at:
            receipt.purchased_at = request.purchased_at
            
        db.add(receipt)
        db.commit()
        db.refresh(receipt)
        
        # TODO: Queue OCR job with Celery
        # process_receipt.delay(receipt.id, request.file_key)
        
        return ReceiptResponse(
            id=receipt.id,
            status=receipt.status
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create receipt: {str(e)}")

@router.get("/{receipt_id}", response_model=ReceiptDetailResponse)
async def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db)
):
    """
    Get receipt status and results
    """
    try:
        receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        if receipt.status == "ready":
            # Get line items with decision engine results
            items = []
            decision_engine = DecisionEngine(db)
            
            for line_item in receipt.line_items:
                # Get product info
                product = None
                if line_item.product_id:
                    product = db.query(Product).filter(Product.id == line_item.product_id).first()
                
                # Get decision
                decision, reasons = decision_engine.get_decision(
                    user_id=receipt.user_id,
                    product_id=line_item.product_id,
                    unit_price=line_item.unit_price,
                    unit_price_uom=line_item.size_uom
                )
                
                # Get price history
                last_price, avg_price = decision_engine.get_price_history(
                    user_id=receipt.user_id,
                    product_id=line_item.product_id
                )
                
                items.append(ItemResponse(
                    product_id=line_item.product_id,
                    name=product.name_norm if product else line_item.raw_desc,
                    brand=product.brand if product else None,
                    size_value=line_item.size_value,
                    size_uom=line_item.size_uom,
                    qty=line_item.qty,
                    price_total=line_item.price_total,
                    unit_price=line_item.unit_price,
                    unit_price_uom=line_item.size_uom,
                    last_price=last_price,
                    avg_price=avg_price,
                    decision=decision,
                    reasons=reasons
                ))
            
            return ReceiptDetailResponse(
                id=receipt.id,
                status=receipt.status,
                items=items
            )
        else:
            return ReceiptDetailResponse(
                id=receipt.id,
                status=receipt.status,
                items=[]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get receipt: {str(e)}")
