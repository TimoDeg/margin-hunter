import asyncio
import logging
import json
import sys
import os
from datetime import datetime
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from typing import List

# Füge parent directory zum Path hinzu für Imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scraper.config import config
from scraper.ebay_scraper import EbayScraper
from scraper.models import Product, Offer, PriceHistory

# Setup Logging
logging.basicConfig(
    level=config.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database Setup (SYNC!)
engine = create_engine(config.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class ScraperRunner:
    def __init__(self):
        self.scraper = EbayScraper(headless=config.HEADLESS)
        
    async def run(self):
        """Main Scraper Loop"""
        try:
            await self.scraper.start()
            logger.info("🚀 Scraper gestartet")
            
            # Hole alle aktiven Produkte aus DB
            session = SessionLocal()
            try:
                products = session.query(Product).filter(Product.active == True).all()
                logger.info(f"📊 Found {len(products)} active products")
                
                if len(products) == 0:
                    logger.warning("⚠️  Keine aktiven Produkte gefunden! Erstelle Demo-Produkte...")
                    await self._create_demo_products(session)
                    products = session.query(Product).filter(Product.active == True).all()
                
                for product in products:
                    await self._scrape_product(session, product)
                    # Kleine Pause zwischen Produkten (rate limiting)
                    await asyncio.sleep(2)
                    
            finally:
                session.close()
            
            logger.info("✅ Scraper Loop komplett")
            
        except Exception as e:
            logger.error(f"❌ Scraper Error: {e}", exc_info=True)
        finally:
            await self.scraper.close()

    async def _create_demo_products(self, session):
        """Erstelle Demo-Produkte für Testing"""
        demo_products = [
            {
                "name": "iPhone 15 Pro",
                "category": "Electronics",
                "brands": ["Apple"],
                "price_min": 800.0,
                "price_max": 1200.0,
                "filters": {"condition": "3000"}
            },
            {
                "name": "AirPods Pro 2",
                "category": "Electronics",
                "brands": ["Apple"],
                "price_min": 150.0,
                "price_max": 250.0,
                "filters": {"condition": "3000"}
            },
        ]
        
        for prod_data in demo_products:
            product = Product(
                name=prod_data["name"],
                category=prod_data["category"],
                brands=prod_data["brands"],
                price_min=prod_data["price_min"],
                price_max=prod_data["price_max"],
                filters=prod_data["filters"],
                active=True
            )
            session.add(product)
        
        session.commit()
        logger.info("✅ Demo-Produkte erstellt")

    async def _scrape_product(self, session, product: Product):
        """Scrape ein einzelnes Produkt"""
        try:
            logger.info(f"🔍 Scraping: {product.name}")
            
            # eBay Search
            offers_data = await self.scraper.search_product(
                product.name,
                product.filters or {}
            )
            
            if not offers_data:
                logger.warning(f"⚠️  Keine Offers gefunden für {product.name}")
                return
            
            # Speichere Offers in DB
            saved_count = 0
            for offer_data in offers_data:
                try:
                    # Check ob Offer schon existiert (Duplikat-Check via URL)
                    existing = session.query(Offer).filter(
                        Offer.source_url == offer_data.get("url")
                    ).first()
                    
                    if existing:
                        logger.debug(f"⏭️  Skipping duplicate: {offer_data['title'][:50]}")
                        continue
                    
                    # Erstelle neues Offer
                    offer = Offer(
                        product_id=product.id,
                        title=offer_data["title"],
                        price=offer_data["price"],
                        shipping=offer_data.get("shipping", 0),
                        source=offer_data["source"],
                        source_url=offer_data.get("url"),
                        condition=offer_data.get("condition"),
                        seller_rating=offer_data.get("rating"),
                    )
                    session.add(offer)
                    session.flush()  # Damit wir offer.id haben
                    
                    # Erstelle Price History Entry
                    price_history = PriceHistory(
                        offer_id=offer.id,
                        price=offer_data["price"],
                        recorded_at=datetime.utcnow()
                    )
                    session.add(price_history)
                    
                    session.commit()
                    saved_count += 1
                    logger.info(f"✅ Saved: {offer_data['title'][:50]} - ${offer_data['price']}")
                    
                except Exception as e:
                    logger.error(f"❌ Error saving offer: {e}")
                    session.rollback()
                    continue
            
            logger.info(f"✅ Gespeichert: {saved_count}/{len(offers_data)} Offers für {product.name}")
                    
        except Exception as e:
            logger.error(f"❌ Error scraping {product.name}: {e}", exc_info=True)


async def main():
    """Entry Point"""
    logger.info("=" * 60)
    logger.info("🚀 MARGIN HUNTER SCRAPER START")
    logger.info("=" * 60)
    
    runner = ScraperRunner()
    await runner.run()
    
    logger.info("=" * 60)
    logger.info("✅ MARGIN HUNTER SCRAPER FINISHED")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

