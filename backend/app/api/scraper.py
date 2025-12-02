from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.post("/start", status_code=status.HTTP_202_ACCEPTED)
async def start_scraper() -> dict:
    # TODO: Celery-Task triggern (z.B. periodic scraping aktivieren)
    return {"detail": "Scraper start requested"}


@router.get("/status")
async def scraper_status() -> dict:
    # TODO: Echten Status aus Redis/Celery lesen
    return {"status": "unknown", "detail": "Scraper status endpoint not yet implemented"}


@router.post("/stop", status_code=status.HTTP_202_ACCEPTED)
async def stop_scraper() -> dict:
    # TODO: Celery-Tasks stoppen/Flag setzen
    return {"detail": "Scraper stop requested"}


