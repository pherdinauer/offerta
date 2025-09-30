"""
Celery worker for async tasks
"""
from celery import Celery
from app.core.config import settings
from app.services.ocr_service import OCRService
from app.services.s3_service import S3Service
from app.core.database import SessionLocal
from app.models.receipt import Receipt, LineItem
from app.models.product import Product, Alias
from app.models.price_event import PriceEvent
from app.services.decision_engine import DecisionEngine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "offerta_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
)

@celery_app.task(bind=True)
def process_receipt(self, receipt_id: int, file_key: str):
    """
    Process receipt with OCR and save results
    """
    db = SessionLocal()
    try:
        # Get receipt
        receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
        if not receipt:
            logger.error(f"Receipt {receipt_id} not found")
            return {"status": "failed", "error": "Receipt not found"}
        
        # Update status to processing
        receipt.status = "processing"
        db.commit()
        
        # Download image from S3
        s3_service = S3Service()
        image_data = s3_service.download_file(settings.MINIO_BUCKET, file_key)
        if not image_data:
            receipt.status = "failed"
            db.commit()
            return {"status": "failed", "error": "Failed to download image"}
        
        # Process with OCR
        ocr_service = OCRService()
        ocr_result = await ocr_service.process_image(image_data)
        if not ocr_result:
            receipt.status = "failed"
            db.commit()
            return {"status": "failed", "error": "OCR processing failed"}
        
        # Parse OCR result
        parsed_data = ocr_service.parse_ocr_result(ocr_result)
        
        # Save line items
        for item_data in parsed_data.get("items", []):
            # Try to match product
            product_id = None
            if item_data.get("raw_desc"):
                # Simple product matching (can be improved)
                product = db.query(Product).filter(
                    Product.name_norm.ilike(f"%{item_data['raw_desc']}%")
                ).first()
                if product:
                    product_id = product.id
            
            # Create line item
            line_item = LineItem(
                receipt_id=receipt_id,
                product_id=product_id,
                raw_desc=item_data.get("raw_desc", ""),
                qty=item_data.get("qty", 1.0),
                price_total=item_data.get("line_total", 0.0),
                unit_price=item_data.get("unit_price_printed"),
                size_value=item_data.get("size_value_raw"),
                size_uom=item_data.get("size_uom_raw"),
                confidence_desc=item_data.get("conf_desc", 0.0),
                confidence_price=item_data.get("conf_price", 0.0)
            )
            db.add(line_item)
            
            # Create price event if we have a product
            if product_id and line_item.unit_price:
                price_event = PriceEvent(
                    user_id=receipt.user_id,
                    product_id=product_id,
                    unit_price=line_item.unit_price,
                    unit_price_uom=line_item.size_uom or "€/100g",
                    price_per_100g_or_L=line_item.unit_price  # Simplified
                )
                db.add(price_event)
        
        # Update receipt status
        receipt.status = "ready"
        receipt.ocr_confidence = parsed_data.get("header", {}).get("confidence", 0.0)
        receipt.total_amount = parsed_data.get("totals", {}).get("total_paid")
        
        db.commit()
        
        logger.info(f"Receipt {receipt_id} processed successfully")
        return {"status": "success", "receipt_id": receipt_id}
        
    except Exception as e:
        logger.error(f"Receipt processing failed: {e}")
        if 'receipt' in locals():
            receipt.status = "failed"
            db.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()

# Make process_receipt available for import
__all__ = ["celery_app", "process_receipt"]
