import asyncio
import logging
from playwright.async_api import async_playwright, Browser
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime
from scraper.config import config

logger = logging.getLogger(__name__)


class EbayScraper:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.playwright = None
        
    async def start(self):
        """Starte Playwright Browser"""
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.headless,
                args=['--disable-blink-features=AutomationControlled']
            )
            logger.info("✅ Playwright Browser gestartet")
        except Exception as e:
            logger.error(f"❌ Browser Start fehlgeschlagen: {e}")
            raise

    async def close(self):
        """Schließe Browser"""
        try:
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("✅ Browser geschlossen")
        except Exception as e:
            logger.error(f"❌ Browser Close fehlgeschlagen: {e}")

    async def search_product(self, product_name: str, filters: Dict) -> List[Dict]:
        """
        Suche Produkt auf eBay
        
        Args:
            product_name: Produkt zum Suchen (z.B. "iPhone 15")
            filters: Dict mit price_min, price_max, condition, etc.
            
        Returns:
            List von Offer-Dicts
        """
        try:
            page = await self.browser.new_page()
            
            # eBay Search Query bauen
            query_params = {
                "_nkw": product_name,
                "_sacat": filters.get("category", "0"),
                "LH_ItemCondition": filters.get("condition", "3000"),  # 3000=All
            }
            
            # Price Filter (wenn vorhanden)
            if filters.get("price_min"):
                query_params["_udlo"] = filters["price_min"]
            if filters.get("price_max"):
                query_params["_udhi"] = filters["price_max"]
            
            # Query String bauen
            query_string = "&".join([f"{k}={v}" for k, v in query_params.items()])
            search_url = f"{config.EBAY_BASE_URL}?{query_string}"
            
            logger.info(f"🔍 Searching: {search_url[:80]}...")
            
            # Navigiere zu eBay
            await page.goto(search_url, wait_until="domcontentloaded", timeout=config.EBAY_TIMEOUT * 1000)
            
            # Warte auf Listings
            await page.wait_for_selector(".s-item", timeout=10000)
            
            # Parse Listings
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            offers = self._extract_offers(soup, product_name)
            
            logger.info(f"✅ Found {len(offers)} offers for {product_name}")
            
            await page.close()
            return offers
            
        except Exception as e:
            logger.error(f"❌ Search fehlgeschlagen für {product_name}: {e}")
            return []

    def _extract_offers(self, soup: BeautifulSoup, product_name: str) -> List[Dict]:
        """
        Parse eBay HTML und extrahiere Angebote
        """
        offers = []
        items = soup.find_all("div", class_="s-item")
        
        for item in items[:config.EBAY_MAX_RESULTS]:
            try:
                # Title
                title_elem = item.find("div", class_="s-item__title")
                title = title_elem.get_text(strip=True) if title_elem else "N/A"
                
                # Price (z.B. "$99.99")
                price_elem = item.find("span", class_="s-item__price")
                price_text = price_elem.get_text(strip=True) if price_elem else "0"
                price = self._parse_price(price_text)
                
                # Shipping
                shipping_elem = item.find("span", class_="s-item__shipping")
                shipping_text = shipping_elem.get_text(strip=True) if shipping_elem else "0"
                shipping = self._parse_price(shipping_text)
                
                # Condition (New/Used)
                condition = "Used"
                condition_elem = item.find("span", class_="SECONDARY_INFO")
                if condition_elem:
                    condition_text = condition_elem.get_text(strip=True)
                    if "New" in condition_text:
                        condition = "New"
                
                # Seller Rating
                rating_elem = item.find("span", class_="s-item__seller-info-text")
                rating = "Unknown"
                if rating_elem:
                    rating = rating_elem.get_text(strip=True)
                
                # URL
                link_elem = item.find("a", class_="s-item__link")
                url = link_elem.get("href", "") if link_elem else ""
                
                if price > 0 and title != "Shop on eBay":  # Nur Items mit Preis, skip ads
                    offers.append({
                        "title": title,
                        "price": price,
                        "shipping": shipping,
                        "condition": condition,
                        "rating": rating,
                        "url": url,
                        "source": "ebay",
                        "product_name": product_name,
                        "scraped_at": datetime.utcnow().isoformat()
                    })
                    
            except Exception as e:
                logger.warning(f"⚠️  Parse error: {e}")
                continue
        
        return offers

    @staticmethod
    def _parse_price(price_str: str) -> float:
        """Parse Price String (z.B. "$99.99" oder "shipping $5.00") zu float"""
        try:
            # Entferne Currency Symbole und Extra Text
            clean = price_str.replace("$", "").replace("€", "").replace("£", "").replace(",", "")
            # Handle "to $XXX" ranges - nimm den niedrigsten Preis
            if "to" in clean:
                clean = clean.split("to")[0].strip()
            # Nur erste Zahl
            clean = clean.split()[0] if clean.split() else "0"
            return float(clean)
        except:
            return 0.0

