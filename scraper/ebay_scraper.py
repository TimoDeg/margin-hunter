import requests
from bs4 import BeautifulSoup
import logging
import time
from datetime import datetime
from typing import List, Dict
from scraper.config import config

logger = logging.getLogger(__name__)


class EbayScraper:
    def __init__(self):
        """Initialisiere HTTP Session mit Headers"""
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        logger.info("✅ eBay Scraper initialisiert (Requests Mode)")
    
    def search_product(self, product_name: str, filters: Dict) -> List[Dict]:
        """
        Suche Produkt auf eBay via HTTP Request
        
        Speed: ~1-2 Sekunden statt 15-30 mit Browser
        """
        try:
            # eBay Search URL bauen
            query_params = {
                "_nkw": product_name,  # Suchbegriff
                "LH_ItemCondition": filters.get("condition", "3000"),  # 3000=All
            }
            
            # Price Filter (optional)
            if filters.get("price_min"):
                query_params["_udlo"] = filters["price_min"]
            if filters.get("price_max"):
                query_params["_udhi"] = filters["price_max"]
            
            # URL bauen
            url = f"{config.EBAY_BASE_URL}"
            
            logger.info(f"🔍 Scraping: {product_name} from eBay...")
            
            # HTTP Request (NICHT Browser!)
            response = self.session.get(
                url,
                params=query_params,
                timeout=config.EBAY_TIMEOUT
            )
            response.raise_for_status()
            
            logger.info(f"✅ Got {len(response.text)} bytes from eBay")
            
            # Parse HTML
            offers = self._extract_offers(response.text, product_name)
            logger.info(f"✅ Extracted {len(offers)} offers")
            
            return offers
            
        except requests.exceptions.Timeout:
            logger.error(f"❌ Timeout scraping {product_name}")
            return []
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Error scraping {product_name}: {e}")
            return []
    
    def _extract_offers(self, html: str, product_name: str) -> List[Dict]:
        """
        Parse HTML und extrahiere Angebote
        """
        offers = []
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            items = soup.find_all("div", class_="s-item")
            
            logger.info(f"Found {len(items)} items in HTML")
            
            for item in items[:config.EBAY_MAX_RESULTS]:
                try:
                    # Title
                    title_elem = item.find("div", class_="s-item__title")
                    title = title_elem.get_text(strip=True) if title_elem else "N/A"
                    
                    # Skip "Shop on eBay" entries
                    if "Shop on eBay" in title or title == "N/A":
                        continue
                    
                    # Price
                    price_elem = item.find("span", class_="s-item__price")
                    price_text = price_elem.get_text(strip=True) if price_elem else "0"
                    price = self._parse_price(price_text)
                    
                    # Shipping
                    shipping_elem = item.find("span", class_="s-item__shipping")
                    shipping_text = shipping_elem.get_text(strip=True) if shipping_elem else "Free"
                    shipping = self._parse_price(shipping_text)
                    
                    # Condition
                    condition = "Used"
                    condition_elem = item.find("span", class_="SECONDARY_INFO")
                    if condition_elem:
                        condition_text = condition_elem.get_text(strip=True)
                        if "New" in condition_text:
                            condition = "New"
                        elif "Refurbished" in condition_text:
                            condition = "Refurbished"
                    
                    # Seller Rating (optional)
                    rating = "Unknown"
                    rating_elem = item.find("span", class_="s-item__seller-info-text")
                    if rating_elem:
                        rating = rating_elem.get_text(strip=True)
                    
                    # URL
                    link_elem = item.find("a", class_="s-item__link")
                    url = link_elem.get("href", "") if link_elem else ""
                    
                    # Nur Items mit gültigem Preis
                    if price > 0 and url:
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
                    logger.warning(f"⚠️ Error parsing item: {e}")
                    continue
            
            logger.info(f"✅ Successfully extracted {len(offers)} offers")
            return offers
            
        except Exception as e:
            logger.error(f"❌ Error parsing HTML: {e}")
            return []
    
    @staticmethod
    def _parse_price(price_str: str) -> float:
        """Parse Price String zu Float"""
        try:
            # Entferne Currency Symbole und Text
            clean = price_str.replace("$", "").replace("€", "").replace("£", "")
            clean = clean.replace(",", "").replace("Free", "0")
            
            # Extrahiere erste Zahl (bei "to" Bereichen)
            if "to" in clean.lower():
                clean = clean.split("to")[0].strip()
            
            # Parse float
            clean = ''.join(c for c in clean if c.isdigit() or c == '.')
            return float(clean) if clean else 0.0
        except:
            return 0.0
    
    def close(self):
        """Schließe Session"""
        self.session.close()
        logger.info("✅ Scraper session closed")
