from celery import shared_task
from datetime import datetime, timezone
import logging
import requests
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from .celery_config import celery_app
from .redis_client import redis_client
from .config import get_settings
from .models import Offer, Product
from .database import SyncSessionLocal

logger = logging.getLogger(__name__)
settings = get_settings()


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def scrape_product_task(self, product_id: int):
    """
    Asynchroner Scraper Task - läuft in Celery Worker (nicht im Backend!)
    
    Vorteile:
    - Backend bleibt responsive (kein Blocking)
    - Auto-Retry bei Fehlern (max 3x)
    - Exponential Backoff bei Rate Limits
    """
    session = SyncSessionLocal()
    
    try:
        # Hole Product
        product = session.get(Product, product_id)
        if not product or not product.active:
            logger.warning(f"⚠️  Product {product_id} nicht gefunden oder inaktiv")
            return {"status": "skipped", "product_id": product_id}
        
        logger.info(f"🔍 Scraping Product: {product.name}")
        
        # Rufe Scraper Service auf (HTTP Call zum separaten Scraper-Service)
        # Alternativ: Importiere Scraper-Code direkt hier
        from scraper.ebay_scraper import EbayScraper
        from scraper.models import Offer as ScraperOffer, PriceHistory as ScraperPriceHistory
        
        scraper = EbayScraper()
        offers_data = scraper.search_product(product.name, product.filters or {})
        
        if not offers_data:
            logger.warning(f"⚠️  Keine Offers gefunden für {product.name}")
            return {"status": "no_offers", "product_id": product_id}
        
        # Batch Duplikat-Check (FIX für N+1 Problem!)
        urls = [o["url"] for o in offers_data]
        existing_urls = set(
            row[0] for row in 
            session.execute(
                select(Offer.url).where(Offer.url.in_(urls))
            ).fetchall()
        )
        
        created = 0
        for offer_data in offers_data:
            # Skip Duplikate
            if offer_data["url"] in existing_urls:
                logger.debug(f"⏭️  Skipping duplicate: {offer_data['title'][:50]}")
                continue
            
            try:
                # Erstelle Offer
                offer = Offer(
                    product_id=product.id,
                    title=offer_data["title"],
                    price=offer_data["price"],
                    url=offer_data["url"],
                    source_url=offer_data.get("url"),
                    shipping=offer_data.get("shipping", 0),
                    source=offer_data.get("source", "ebay"),
                    condition=offer_data.get("condition"),
                    seller_rating=offer_data.get("rating"),
                    status="new",
                    first_seen_at=datetime.now(timezone.utc),
                    last_checked_at=datetime.now(timezone.utc),
                )
                session.add(offer)
                session.flush()
                
                created += 1
                logger.info(f"✅ Saved: {offer_data['title'][:50]} - ${offer_data['price']}")
                
            except Exception as e:
                logger.error(f"❌ Error saving offer: {e}")
                session.rollback()
                continue
        
        session.commit()
        scraper.close()
        
        logger.info(f"✅ Scraping komplett: {created}/{len(offers_data)} neue Offers für {product.name}")
        
        return {
            "status": "success",
            "product_id": product_id,
            "product_name": product.name,
            "offers_found": len(offers_data),
            "offers_created": created,
        }
        
    except requests.exceptions.Timeout:
        logger.error(f"⏱️  Timeout beim Scrapen von Product {product_id}")
        raise self.retry(exc=requests.exceptions.Timeout("eBay Timeout"), countdown=30)
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            logger.error(f"🚫 eBay blockiert uns (403) für Product {product_id}")
            raise self.retry(exc=e, countdown=120)  # 2min warten bei Rate Limit
        elif e.response.status_code >= 500:
            logger.error(f"🔥 eBay Server Error ({e.response.status_code})")
            raise self.retry(exc=e, countdown=60)
        else:
            raise
            
    except Exception as exc:
        logger.exception(f"❌ Unerwarteter Fehler beim Scrapen von Product {product_id}")
        raise self.retry(exc=exc, countdown=10)
        
    finally:
        session.close()


@shared_task(bind=True)
def scrape_all_active_products(self):
    """
    Scrape alle aktiven Products - orchestriert mehrere scrape_product_task Jobs
    """
    session = SyncSessionLocal()
    
    try:
        products = session.execute(
            select(Product).where(Product.active == True)
        ).scalars().all()
        
        if not products:
            logger.warning("⚠️  Keine aktiven Products gefunden")
            return {"status": "no_products"}
        
        logger.info(f"🚀 Starting Scraper für {len(products)} Products")
        
        # Starte einen Task pro Product (parallel!)
        task_ids = []
        for product in products:
            task = scrape_product_task.delay(product.id)
            task_ids.append(str(task.id))
        
        # Speichere Task IDs in Redis für Status-Tracking
        if redis_client:
            redis_client.setex(
                "scraper:current_run",
                3600,
                ",".join(task_ids)
            )
        
        return {
            "status": "started",
            "products_count": len(products),
            "task_ids": task_ids,
        }
        
    finally:
        session.close()


@shared_task(bind=True, max_retries=3)
def test_celery_task(self):
    """Test Task - läuft erfolgreich, wenn Celery funktioniert"""
    try:
        logger.info("✅ Test Celery Task läuft")
        return {"status": "success", "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as exc:
        logger.error(f"❌ Test Celery Task fehlgeschlagen: {exc}")
        raise self.retry(exc=exc, countdown=5)

