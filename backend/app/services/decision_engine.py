"""
Decision engine for offer analysis
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Tuple, List
from datetime import datetime, timedelta
from app.models.price_event import PriceEvent
from app.core.config import settings

class DecisionEngine:
    def __init__(self, db: Session):
        self.db = db
    
    def get_decision(self, user_id: int, product_id: int, unit_price: float, unit_price_uom: str) -> Tuple[str, List[str]]:
        """
        Get offer decision (green/yellow/red) and reasons
        """
        if not product_id or not unit_price:
            return "unknown", ["Dati insufficienti"]
        
        # Get price history for this user and product
        price_events = self.db.query(PriceEvent).filter(
            and_(
                PriceEvent.user_id == user_id,
                PriceEvent.product_id == product_id,
                PriceEvent.ts >= datetime.utcnow() - timedelta(days=settings.PRICE_HISTORY_MONTHS * 30)
            )
        ).order_by(PriceEvent.ts.desc()).all()
        
        if not price_events:
            return "unknown", ["Nessun dato storico disponibile"]
        
        # Calculate percentiles
        prices = [event.price_per_100g_or_L for event in price_events]
        prices.sort()
        
        n = len(prices)
        p20 = prices[int(n * 0.2)] if n > 0 else 0
        p50 = prices[int(n * 0.5)] if n > 0 else 0
        p80 = prices[int(n * 0.8)] if n > 0 else 0
        
        # Normalize current price to same unit
        current_price_per_100g = self._normalize_price(unit_price, unit_price_uom)
        
        # Decision logic
        if current_price_per_100g < p20:
            return "green", [f"Ottimo prezzo! Sotto il tuo p20 (€{p20:.2f})"]
        elif abs(current_price_per_100g - p50) / p50 <= settings.PRICE_TOLERANCE_PERCENT / 100:
            return "yellow", [f"Prezzo normale (€{p50:.2f} ±{settings.PRICE_TOLERANCE_PERCENT}%)"]
        else:
            return "red", [f"Prezzo alto rispetto alla tua media (€{p50:.2f})"]
    
    def get_price_history(self, user_id: int, product_id: int) -> Tuple[float, float]:
        """
        Get last price and average price for a product
        """
        if not product_id:
            return None, None
        
        # Get last price
        last_event = self.db.query(PriceEvent).filter(
            and_(
                PriceEvent.user_id == user_id,
                PriceEvent.product_id == product_id
            )
        ).order_by(PriceEvent.ts.desc()).first()
        
        last_price = last_event.price_per_100g_or_L if last_event else None
        
        # Get average price (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        avg_result = self.db.query(func.avg(PriceEvent.price_per_100g_or_L)).filter(
            and_(
                PriceEvent.user_id == user_id,
                PriceEvent.product_id == product_id,
                PriceEvent.ts >= six_months_ago
            )
        ).scalar()
        
        avg_price = float(avg_result) if avg_result else None
        
        return last_price, avg_price
    
    def _normalize_price(self, unit_price: float, unit_price_uom: str) -> float:
        """
        Normalize price to €/100g or €/L
        """
        if "100g" in unit_price_uom:
            return unit_price
        elif "kg" in unit_price_uom:
            return unit_price / 10  # Convert €/kg to €/100g
        elif "L" in unit_price_uom:
            return unit_price
        elif "ml" in unit_price_uom:
            return unit_price * 1000  # Convert €/ml to €/L
        else:
            return unit_price
