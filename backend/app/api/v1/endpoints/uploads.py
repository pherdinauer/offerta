"""
Upload endpoints for presigned URLs
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.services.s3_service import S3Service

router = APIRouter()

class UploadRequest(BaseModel):
    client_upload_id: str

class UploadResponse(BaseModel):
    upload_url: str
    file_key: str
    expires_in: int

@router.post("/", response_model=UploadResponse)
async def create_upload_url(
    request: UploadRequest,
    db: Session = Depends(get_db)
):
    """
    Generate presigned URL for file upload
    """
    try:
        # Generate unique file key
        file_key = f"receipts/{uuid.uuid4()}.jpg"
        
        # Create S3 service
        s3_service = S3Service()
        
        # Generate presigned PUT URL
        upload_url = s3_service.generate_presigned_put_url(
            bucket=settings.MINIO_BUCKET,
            key=file_key,
            expires_in=300  # 5 minutes
        )
        
        return UploadResponse(
            upload_url=upload_url,
            file_key=file_key,
            expires_in=300
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")
