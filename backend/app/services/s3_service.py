"""
S3/MinIO service for object storage
"""
from minio import Minio
from app.core.config import settings
from typing import Optional
import io

class S3Service:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        
        # Ensure bucket exists
        if not self.client.bucket_exists(settings.MINIO_BUCKET):
            self.client.make_bucket(settings.MINIO_BUCKET)
    
    def generate_presigned_put_url(self, bucket: str, key: str, expires_in: int = 300) -> str:
        """Generate presigned PUT URL for upload"""
        return self.client.presigned_put_object(
            bucket_name=bucket,
            object_name=key,
            expires=expires_in
        )
    
    def generate_presigned_get_url(self, bucket: str, key: str, expires_in: int = 3600) -> str:
        """Generate presigned GET URL for download"""
        return self.client.presigned_get_object(
            bucket_name=bucket,
            object_name=key,
            expires=expires_in
        )
    
    def upload_file(self, bucket: str, key: str, file_data: bytes, content_type: str = "image/jpeg") -> bool:
        """Upload file to S3/MinIO"""
        try:
            self.client.put_object(
                bucket_name=bucket,
                object_name=key,
                data=io.BytesIO(file_data),
                length=len(file_data),
                content_type=content_type
            )
            return True
        except Exception:
            return False
    
    def download_file(self, bucket: str, key: str) -> Optional[bytes]:
        """Download file from S3/MinIO"""
        try:
            response = self.client.get_object(bucket, key)
            return response.read()
        except Exception:
            return None
    
    def delete_file(self, bucket: str, key: str) -> bool:
        """Delete file from S3/MinIO"""
        try:
            self.client.remove_object(bucket, key)
            return True
        except Exception:
            return False
