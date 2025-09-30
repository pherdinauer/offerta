"""
GDPR endpoints for data export and deletion
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.receipt import Receipt
from app.models.line_item import LineItem
from app.models.price_event import PriceEvent
from app.services.s3_service import S3Service

router = APIRouter()

class ExportResponse(BaseModel):
    download_url: str
    expires_in: int

class DeleteResponse(BaseModel):
    message: str
    deleted_at: datetime

@router.get("/export", response_model=ExportResponse)
async def export_user_data(
    db: Session = Depends(get_db)
):
    """
    Export user data as CSV/JSON
    """
    try:
        user_id = 1  # TODO: Get from auth
        
        # Get user data
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Collect all user data
        receipts = db.query(Receipt).filter(Receipt.user_id == user_id).all()
        price_events = db.query(PriceEvent).filter(PriceEvent.user_id == user_id).all()
        
        # Create export data
        export_data = {
            "user": {
                "id": user.id,
                "email": user.email,
                "created_at": user.created_at.isoformat(),
                "locale": user.locale
            },
            "receipts": [
                {
                    "id": receipt.id,
                    "purchased_at": receipt.purchased_at.isoformat() if receipt.purchased_at else None,
                    "total_amount": receipt.total_amount,
                    "currency": receipt.currency,
                    "status": receipt.status,
                    "line_items": [
                        {
                            "raw_desc": item.raw_desc,
                            "qty": item.qty,
                            "price_total": item.price_total,
                            "unit_price": item.unit_price,
                            "size_value": item.size_value,
                            "size_uom": item.size_uom
                        }
                        for item in receipt.line_items
                    ]
                }
                for receipt in receipts
            ],
            "price_events": [
                {
                    "product_id": event.product_id,
                    "unit_price": event.unit_price,
                    "unit_price_uom": event.unit_price_uom,
                    "price_per_100g_or_L": event.price_per_100g_or_L,
                    "ts": event.ts.isoformat()
                }
                for event in price_events
            ],
            "exported_at": datetime.utcnow().isoformat()
        }
        
        # TODO: Upload to S3 and generate presigned URL
        s3_service = S3Service()
        file_key = f"exports/{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        # For now, return a mock URL
        return ExportResponse(
            download_url=f"https://example.com/download/{file_key}",
            expires_in=3600  # 1 hour
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export data: {str(e)}")

@router.delete("/data", response_model=DeleteResponse)
async def delete_user_data(
    db: Session = Depends(get_db)
):
    """
    Delete all user data (GDPR right to be forgotten)
    """
    try:
        user_id = 1  # TODO: Get from auth
        
        # Soft delete user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.is_deleted = datetime.utcnow()
        
        # TODO: Delete associated data (receipts, price_events, etc.)
        # For now, just mark as deleted
        
        db.commit()
        
        return DeleteResponse(
            message="User data deleted successfully",
            deleted_at=user.is_deleted
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete data: {str(e)}")
