"""
API v1 router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import uploads, receipts, offer_check, gdpr

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
api_router.include_router(offer_check.router, prefix="/offer-check", tags=["offer-check"])
api_router.include_router(gdpr.router, prefix="/me", tags=["gdpr"])
