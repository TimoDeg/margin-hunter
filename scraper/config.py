import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # eBay
    EBAY_BASE_URL = "https://www.ebay.com/sch/i.html"
    EBAY_MAX_RESULTS = int(os.getenv("EBAY_MAX_RESULTS", "50"))
    EBAY_TIMEOUT = int(os.getenv("SCRAPER_TIMEOUT", "30"))
    
    # Database (Scraper nutzt SYNC!)
    DATABASE_URL = os.getenv("DATABASE_URL_SYNC") or os.getenv("DATABASE_URL", "postgresql://margin_user:pass@postgres:5432/margin_hunter")
    # Entferne asyncpg prefix falls vorhanden (Scraper ist SYNC!)
    if DATABASE_URL and "+asyncpg" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Scraper Settings
    MARGIN_THRESHOLD = float(os.getenv("MARGIN_THRESHOLD", "20"))
    HEADLESS = os.getenv("PLAYWRIGHT_HEADLESS", "True") == "True"
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


config = Config()

