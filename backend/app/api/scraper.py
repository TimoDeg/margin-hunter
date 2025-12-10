from datetime import datetime, timezone
from random import uniform

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import Offer, Product
from ..tasks import scrape_all_active_products, scrape_product_task
from ..redis_client import redis_client

router = APIRouter()


SCRAPER_STATUS: dict[str, object] = {
    "status": "idle",  # idle | running | ok | error
    "last_run_at": None,
    "last_error": None,
}


async def _run_demo_scrape(session: AsyncSession) -> int:
    """
    Einfacher Demo-Scraper:
    - Nimmt alle aktiven Produkte
    - Legt pro Produkt ein neues Demo-Offer an
    """
    result = await session.execute(select(Product).where(Product.active.is_(True)))
    products = list(result.scalars().all())

    if not products:
        return 0

    created = 0
    now = datetime.now(timezone.utc)

    for product in products:
        # Preis grob im Rahmen des definierten Min/Max-Bereichs wählen
        base_price = uniform(product.price_min, product.price_max)
        margin_percent = uniform(5.0, 25.0)
        geizhals_price = round(base_price * (1 + margin_percent / 100), 2)

        url = f"https://demo.margin-hunter.local/product/{product.id}/{int(now.timestamp())}-{created}"

        offer = Offer(
            product_id=product.id,
            title=f"Demo-Angebot {product.name}",
            price=round(base_price, 2),
            url=url,
            image_url=None,
            seller_name="Demo Seller",
            location="Demo City",
            description="Dies ist ein Demo-Angebot, erzeugt vom Run-Once-Scraper.",
            status="new",
            margin_percent=round(margin_percent, 1),
            geizhals_price=geizhals_price,
            first_seen_at=now,
            last_checked_at=now,
        )
        session.add(offer)
        created += 1

    await session.commit()
    return created


@router.post("/run-once", status_code=status.HTTP_202_ACCEPTED)
async def run_scraper_once(
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Führe einen einfachen Demo-Scrape-Lauf aus und schreibe Offers direkt in die DB.
    """
    # Prüfe auf "running" Status um Race Conditions zu vermeiden
    if SCRAPER_STATUS.get("status") == "running":
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Scraper läuft bereits (Status: {SCRAPER_STATUS.get('status')}).",
        )

    SCRAPER_STATUS["status"] = "running"
    SCRAPER_STATUS["last_run_at"] = datetime.now(timezone.utc).isoformat()
    SCRAPER_STATUS["last_error"] = None

    try:
        created = await _run_demo_scrape(session)
    except Exception as exc:  # pragma: no cover - defensive
        SCRAPER_STATUS["status"] = "error"
        SCRAPER_STATUS["last_error"] = str(exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scraper-Lauf fehlgeschlagen: {exc}",
        ) from exc

    SCRAPER_STATUS["status"] = "idle"
    return {"detail": f"Scraper run completed, created {created} offers."}


@router.get("/status")
async def scraper_status() -> dict:
    """
    Liefert den aktuellen (in-memory) Status des Scrapers.
    """
    return {
        "status": SCRAPER_STATUS.get("status", "idle"),
        "last_run_at": SCRAPER_STATUS.get("last_run_at"),
        "last_error": SCRAPER_STATUS.get("last_error"),
    }


@router.post("/start", status_code=status.HTTP_202_ACCEPTED)
async def start_scraper() -> dict:
    """
    Startet den Scraper asynchron über Celery Tasks.
    
    Das Backend bleibt responsive, der Scraper läuft im Hintergrund.
    """
    # Prüfe ob bereits läuft
    if redis_client:
        current_run = redis_client.get("scraper:current_run")
        if current_run:
            return {
                "detail": "Scraper läuft bereits",
                "status": "already_running",
            }
    
    # Starte async Celery Task
    task = scrape_all_active_products.delay()
    
    SCRAPER_STATUS["status"] = "running"
    SCRAPER_STATUS["last_run_at"] = datetime.now(timezone.utc).isoformat()
    SCRAPER_STATUS["last_error"] = None
    
    return {
        "detail": "Scraper gestartet (asynchron)",
        "task_id": str(task.id),
        "status": "running",
    }


@router.post("/start-sync", status_code=status.HTTP_202_ACCEPTED)
async def start_scraper_sync(
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Legacy: Synchroner Demo-Scraper (blockiert Backend).
    Nur für Testing! Nutze /start für Production.
    """
    return await run_scraper_once(session)


@router.post("/stop", status_code=status.HTTP_202_ACCEPTED)
async def stop_scraper() -> dict:
    """
    Stoppt den Scraper und setzt den Status zurück.
    Nützlich um aus einem Error-Status herauszukommen.
    """
    SCRAPER_STATUS["status"] = "idle"
    SCRAPER_STATUS["last_error"] = None
    return {"detail": "Scraper stopped and reset to idle"}



