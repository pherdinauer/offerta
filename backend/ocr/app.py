"""
PaddleOCR service for receipt processing
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from PIL import Image
import io
import json
from paddleocr import PaddleOCR
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PaddleOCR Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR
try:
    ocr = PaddleOCR(use_angle_cls=True, lang='it', show_log=False)
    logger.info("PaddleOCR initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize PaddleOCR: {e}")
    ocr = None

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess image for better OCR results
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Resize if too large
        height, width = image.shape[:2]
        if max(height, width) > 2500:
            scale = 2500 / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        return thresh
        
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        # Return original image if preprocessing fails
        nparr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

def parse_ocr_result(ocr_result: list) -> dict:
    """
    Parse PaddleOCR result into structured format
    """
    try:
        items = []
        
        for line in ocr_result:
            if len(line) >= 2:
                text = line[1][0] if isinstance(line[1], (list, tuple)) else str(line[1])
                confidence = line[1][1] if isinstance(line[1], (list, tuple)) and len(line[1]) > 1 else 0.0
                bbox = line[0] if line[0] else [[0, 0], [0, 0], [0, 0], [0, 0]]
                
                # Try to extract price from text
                import re
                price_match = re.search(r'(\d+[,.]?\d*)\s*€', text)
                unit_price = None
                if price_match:
                    try:
                        unit_price = float(price_match.group(1).replace(',', '.'))
                    except:
                        pass
                
                # Try to extract size information
                size_match = re.search(r'(\d+)\s*(g|kg|ml|cl|l)', text, re.IGNORECASE)
                size_value = None
                size_uom = None
                if size_match:
                    try:
                        size_value = float(size_match.group(1))
                        size_uom = size_match.group(2).upper()
                    except:
                        pass
                
                items.append({
                    "text": text,
                    "confidence": confidence,
                    "bbox": bbox,
                    "unit_price": unit_price,
                    "size_value": size_value,
                    "size_uom": size_uom
                })
        
        return {
            "items": items,
            "total_items": len(items)
        }
        
    except Exception as e:
        logger.error(f"OCR result parsing failed: {e}")
        return {"items": [], "total_items": 0}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "ocr_ready": ocr is not None}

@app.post("/ocr")
async def process_receipt(image: UploadFile = File(...)):
    """
    Process receipt image with PaddleOCR
    """
    try:
        if not ocr:
            raise HTTPException(status_code=500, detail="OCR not initialized")
        
        # Read image data
        image_data = await image.read()
        
        # Preprocess image
        processed_image = preprocess_image(image_data)
        
        # Run OCR
        result = ocr.ocr(processed_image, cls=True)
        
        # Parse result
        parsed_result = parse_ocr_result(result[0] if result else [])
        
        return {
            "success": True,
            "result": parsed_result,
            "image_size": len(image_data)
        }
        
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8866)
