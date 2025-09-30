"""
OCR service using PaddleOCR
"""
import httpx
import json
from typing import Dict, Any, Optional
from app.core.config import settings

class OCRService:
    def __init__(self):
        self.base_url = settings.PADDLEOCR_URL
        
    async def process_image(self, image_data: bytes) -> Optional[Dict[str, Any]]:
        """
        Process image with PaddleOCR and return structured data
        """
        try:
            async with httpx.AsyncClient() as client:
                # Send image to PaddleOCR service
                files = {"image": ("receipt.jpg", image_data, "image/jpeg")}
                response = await client.post(
                    f"{self.base_url}/ocr",
                    files=files,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return None
                    
        except Exception as e:
            print(f"OCR processing failed: {e}")
            return None
    
    def parse_ocr_result(self, ocr_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse PaddleOCR result into structured format
        """
        try:
            # Extract header information
            header = {
                "merchant_name": None,
                "merchant_address": None,
                "datetime": None,
                "receipt_number": None,
                "vat_id": None,
                "currency": "EUR",
                "confidence": 0.0,
                "bbox": [0, 0, 1, 1]
            }
            
            # Extract items
            items = []
            for item in ocr_data.get("items", []):
                parsed_item = {
                    "raw_desc": item.get("text", ""),
                    "qty": 1.0,
                    "unit_price_printed": None,
                    "line_total": None,
                    "size_value_raw": None,
                    "size_uom_raw": None,
                    "ean": None,
                    "department_raw": None,
                    "bbox": item.get("bbox", [0, 0, 1, 1]),
                    "conf_desc": item.get("confidence", 0.0),
                    "conf_price": 0.0
                }
                items.append(parsed_item)
            
            # Extract totals
            totals = {
                "discounts_global": [],
                "subtotal": None,
                "tax_total": 0.0,
                "total_paid": None,
                "payment_method_raw": None,
                "bbox_total": [0, 0, 1, 1],
                "confidence": 0.0
            }
            
            return {
                "header": header,
                "items": items,
                "totals": totals
            }
            
        except Exception as e:
            print(f"OCR parsing failed: {e}")
            return {
                "header": {"confidence": 0.0},
                "items": [],
                "totals": {"confidence": 0.0}
            }
