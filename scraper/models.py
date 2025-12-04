"""
Scraper-spezifische Model-Definitionen (SYNC SQLAlchemy).
Diese Models sind unabhängig vom Backend, um Import-Probleme zu vermeiden.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    brands = Column(JSON, nullable=False)
    filters = Column(JSON, nullable=False)
    price_min = Column(Float, nullable=False)
    price_max = Column(Float, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    url = Column(String(500), nullable=False, unique=True)
    source_url = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)
    seller_name = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(String, nullable=True)
    
    # Scraper-spezifische Felder
    source = Column(String(50), nullable=True, default="ebay")
    shipping = Column(Float, nullable=True, default=0.0)
    condition = Column(String(50), nullable=True)
    seller_rating = Column(String(100), nullable=True)
    
    status = Column(String(50), nullable=False, default="new")
    margin_percent = Column(Float, nullable=True)
    geizhals_price = Column(Float, nullable=True)
    
    first_seen_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    last_checked_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

