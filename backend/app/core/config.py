"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://offerta_user:offerta_pass@localhost:5432/offerta_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # MinIO/S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "receipts"
    MINIO_SECURE: bool = False
    
    # PaddleOCR
    PADDLEOCR_URL: str = "http://localhost:8866"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # File upload limits
    MAX_FILE_SIZE: int = 2 * 1024 * 1024  # 2MB
    ALLOWED_MIME_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # OCR settings
    OCR_CONFIDENCE_THRESHOLD: float = 0.5
    OCR_LANGUAGES: List[str] = ["it", "en"]
    
    # Decision engine
    PRICE_HISTORY_MONTHS: int = 9
    PRICE_TOLERANCE_PERCENT: float = 5.0
    
    class Config:
        env_file = ".env"

settings = Settings()
