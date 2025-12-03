from fastapi import APIRouter

from . import offers, products, scraper, notifications

api_router = APIRouter(prefix="/api")

api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(offers.router, prefix="/offers", tags=["offers"])
api_router.include_router(scraper.router, prefix="/scraper", tags=["scraper"])
api_router.include_router(
    notifications.router, prefix="/notifications", tags=["notifications"]
)


