# 🎯 Margin Hunter - Technische Dokumentation

Ein vollständiges Arbitrage-Tool zum automatisierten Scrapen von eBay-Angeboten, Berechnung von Gewinnmargen und Benachrichtigung via Telegram.

---

## 📋 Inhaltsverzeichnis

1. [Architektur-Überblick](#-architektur-überblick)
2. [Technischer Stack](#-technischer-stack)
3. [Systemarchitektur & Datenfluss](#-systemarchitektur--datenfluss)
4. [Komponenten im Detail](#-komponenten-im-detail)
5. [Datenmodell](#-datenmodell)
6. [API-Übersicht](#-api-übersicht)
7. [Deployment & Setup](#-deployment--setup)
8. [Troubleshooting](#-troubleshooting)

---

## 🏗️ Architektur-Überblick

Margin Hunter ist eine **Microservices-Architektur** mit folgenden Hauptkomponenten:

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX (Port 80)                       │
│                   Reverse Proxy & Router                     │
└─────────────────┬───────────────────────────┬────────────────┘
                  │                           │
        ┌─────────▼─────────┐       ┌────────▼─────────┐
        │  Frontend (React)  │       │  Backend (FastAPI)│
        │  Dark Mode SPA     │       │  REST API         │
        │  Vite + Tailwind   │       │  Port 8000        │
        └────────────────────┘       └───────┬───────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                    │                    │
              ┌─────────▼──────┐   ┌────────▼─────┐   ┌─────────▼────────┐
              │  PostgreSQL    │   │   Redis      │   │  Scraper Service │
              │  Datenbank     │   │   Cache      │   │  eBay Scraping   │
              │  Port 5432     │   │   Port 6379  │   │  (Python)        │
              └────────────────┘   └──────────────┘   └──────────────────┘
                                             │
                        ┌────────────────────┴────────────────────┐
                        │                                         │
              ┌─────────▼──────┐                      ┌──────────▼────────┐
              │ Celery Worker  │                      │  Telegram Bot     │
              │ Async Tasks    │                      │  Notifications    │
              │                │                      │  Port 8001        │
              └────────────────┘                      └───────────────────┘
```

---

## 🔧 Technischer Stack

### Backend
- **FastAPI** (Python 3.11+) - Moderne async REST API
- **SQLAlchemy 2.0** - ORM mit async Support
- **PostgreSQL 16** - Hauptdatenbank
- **Redis 7** - Caching & Task Queue (Celery Backend)
- **Celery** - Asynchrone Task-Verarbeitung
- **Structlog** - Strukturiertes Logging

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server
- **Tailwind CSS** - Utility-First CSS
- **React Router** - Client-Side Routing

### Scraper
- **Requests** - HTTP Client (schneller als Selenium!)
- **BeautifulSoup4** - HTML Parsing
- **SQLAlchemy** - DB Access (sync)

### Infrastructure
- **Docker & Docker Compose** - Containerisierung
- **nginx** - Reverse Proxy & Static File Serving
- **python-telegram-bot** - Telegram Integration

---

## 🔄 Systemarchitektur & Datenfluss

### 1. **Request Flow: Browser → API**

```
Browser (http://localhost)
    ↓
nginx (Port 80)
    ├─ /api/* → Backend:8000 (FastAPI)
    ├─ /health → Backend:8000/health
    ├─ /docs → Backend:8000/docs (Swagger)
    └─ /* → Frontend:80 (React SPA)
```

**nginx als Single Entry Point:**
- Alle HTTP-Requests gehen über nginx (Port 80)
- nginx routet basierend auf dem Pfad:
  - API-Calls (`/api/*`) → Backend
  - Statische Frontend-Requests (`/`, `/offers`, etc.) → Frontend
- **SPA-Fallback:** Bei 404 wird auf `/` (index.html) zurückgefallen, damit React Router funktioniert

### 2. **Scraper Workflow**

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRAPER LIFECYCLE                         │
└─────────────────────────────────────────────────────────────┘

1. User klickt "Scraper Starten" im Frontend
    ↓
2. POST /api/scraper/start → Backend
    ↓
3. Backend ruft run_scraper_once() auf
    ↓
4. Holt aktive Products aus PostgreSQL:
   SELECT * FROM products WHERE active = true
    ↓
5. Pro Product:
   a) EbayScraper.search_product(name, filters)
      - Baut eBay Search URL mit Parametern
      - Sendet HTTP GET Request zu eBay
      - Parst HTML mit BeautifulSoup
      - Extrahiert Offers (Title, Price, URL, etc.)
   
   b) Duplikat-Check:
      - SELECT * FROM offers WHERE source_url = ?
      - Überspringt existierende URLs
   
   c) Speichert neue Offers:
      - INSERT INTO offers (...)
      - INSERT INTO price_history (offer_id, price, recorded_at)
    ↓
6. Scraper-Status wird aktualisiert:
   SCRAPER_STATUS = {"status": "idle", "last_run_at": "..."}
    ↓
7. Response: {"detail": "Created X offers"}
```

**Technische Details:**
- **HTTP statt Browser:** Scraper nutzt `requests` Library (1-2s) statt Selenium (15-30s)
- **Rate Limiting:** 2 Sekunden Pause zwischen Products (`time.sleep(2)`)
- **Duplikat-Prevention:** Unique Constraint auf `offers.url`
- **Transaktionale Sicherheit:** Jedes Offer wird einzeln committed (Rollback bei Fehler)

### 3. **Database Schema & Beziehungen**

```
┌──────────────────┐         ┌──────────────────┐
│    Products      │1       *│     Offers       │
│──────────────────│◄────────┤──────────────────│
│ id (PK)          │         │ id (PK)          │
│ name             │         │ product_id (FK)  │
│ category         │         │ title            │
│ brands (JSONB)   │         │ price            │
│ filters (JSONB)  │         │ url (UNIQUE)     │
│ price_min        │         │ source           │
│ price_max        │         │ status           │
│ active           │         │ margin_percent   │
│ created_at       │         │ geizhals_price   │
│ updated_at       │         │ first_seen_at    │
└──────────────────┘         └────────┬─────────┘
                                      │
                                      │1
                                      │
                                      │*
                             ┌────────▼─────────┐
                             │  Price_History   │
                             │──────────────────│
                             │ id (PK)          │
                             │ offer_id (FK)    │
                             │ price            │
                             │ recorded_at      │
                             └──────────────────┘
```

### 4. **Frontend State Management**

```
┌─────────────────────────────────────────────────────────────┐
│                     REACT COMPONENT TREE                     │
└─────────────────────────────────────────────────────────────┘

App.tsx (Router)
  ├─ Dashboard
  │   └─ useHealth() → GET /api/health
  │
  ├─ Offers
  │   ├─ useOffers(status, minMargin) → GET /api/offers
  │   ├─ Filter Controls (Status Dropdown, Margin Slider)
  │   ├─ Offers Table (Sortable)
  │   └─ Offer Detail Panel
  │       └─ PUT /api/offers/{id}/status
  │
  ├─ Products
  │   ├─ useProducts() → GET /api/products
  │   ├─ Product Table
  │   └─ Product Form (Create/Edit/Delete)
  │       ├─ POST /api/products
  │       ├─ PUT /api/products/{id}
  │       └─ DELETE /api/products/{id}
  │
  └─ Scraper
      ├─ useScraper() → GET /api/scraper/status
      └─ Control Buttons
          ├─ POST /api/scraper/start
          └─ POST /api/scraper/stop
```

**Custom Hooks:**
- `useHealth()` - Polling (30s) für Backend Health Status
- `useOffers(status, minMargin)` - Bietet Filtering & Auto-Refresh
- `useProducts()` - CRUD Operations für Products
- `useScraper()` - Scraper Status & Control

---

## 📦 Komponenten im Detail

### 1. **Backend (FastAPI)**

**Dateien:**
- `backend/app/main.py` - FastAPI App, CORS, Lifespan Events
- `backend/app/database.py` - SQLAlchemy Setup (async engine)
- `backend/app/models/` - ORM Models (Product, Offer, PriceHistory)
- `backend/app/api/` - REST Endpoints

**Wichtige Endpoints:**

```python
# Health Check
GET /api/health
Response: {
  "status": "ok",
  "timestamp": "2025-12-10T...",
  "services": {
    "database": "ok",
    "redis": "ok",
    "celery": "ok"
  }
}

# Offers
GET /api/offers?status=new&min_margin=10&limit=50
Response: [
  {
    "id": 1,
    "product_id": 1,
    "title": "iPhone 15 Pro...",
    "price": 899.99,
    "url": "https://ebay.com/...",
    "status": "new",
    "margin_percent": 15.5,
    "geizhals_price": 1050.00,
    "first_seen_at": "2025-12-10T..."
  }
]

# Products
GET /api/products
POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}

# Scraper
GET /api/scraper/status
POST /api/scraper/start
POST /api/scraper/stop
POST /api/scraper/run-once  # Demo-Scrape

# Notifications
GET /api/notifications/status
POST /api/notifications/test
```

**Authentifizierung:**
- Aktuell **keine Auth** (Development Mode)
- TODO: JWT Tokens für Production

### 2. **Scraper Service**

**Dateien:**
- `scraper/main.py` - Scraper Runner (Hauptlogik)
- `scraper/ebay_scraper.py` - eBay HTTP Scraper
- `scraper/config.py` - Configuration (ENV Vars)
- `scraper/models.py` - SQLAlchemy Models (sync)

**Funktionsweise:**

```python
# ScraperRunner.run() - Main Loop
1. Hole aktive Products: session.query(Product).filter(active=True)
2. Pro Product:
   - EbayScraper.search_product(name, filters)
   - Parse HTML mit BeautifulSoup
   - Extrahiere Offers (Title, Price, URL, Condition, Shipping)
   - Duplikat-Check (source_url)
   - INSERT neue Offers + PriceHistory
3. Close Session
```

**eBay Scraping Details:**

```python
# ebay_scraper.py
def search_product(product_name: str, filters: Dict) -> List[Dict]:
    # 1. Build eBay Search URL
    url = "https://www.ebay.com/sch/i.html"
    params = {
        "_nkw": product_name,  # Search Query
        "LH_ItemCondition": "3000",  # All Conditions
        "_udlo": price_min,  # Min Price
        "_udhi": price_max   # Max Price
    }
    
    # 2. HTTP GET Request (mit User-Agent Header)
    response = requests.get(url, params=params, timeout=10)
    
    # 3. Parse HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    items = soup.find_all("div", class_="s-item")
    
    # 4. Extract Offer Data
    for item in items:
        title = item.find("div", class_="s-item__title").get_text()
        price = item.find("span", class_="s-item__price").get_text()
        url = item.find("a", class_="s-item__link")["href"]
        # ... condition, shipping, rating
        
        offers.append({
            "title": title,
            "price": parse_price(price),
            "url": url,
            "source": "ebay"
        })
    
    return offers
```

**Warum Requests statt Selenium?**
- ✅ **10-20x schneller** (1-2s vs 15-30s)
- ✅ **Weniger Ressourcen** (kein Browser-Overhead)
- ✅ **Einfacher zu deployen** (keine Chromium-Dependencies)
- ⚠️ **Achtung:** Funktioniert nur bei Server-Side Rendered HTML (eBay ist OK, viele moderne Sites nicht)

### 3. **Frontend (React + TypeScript)**

**Dateien:**
- `frontend/src/App.tsx` - Router & Layout
- `frontend/src/pages/` - Page Components
- `frontend/src/hooks/` - Custom React Hooks
- `frontend/src/api/` - API Client Functions

**Routing:**

```tsx
// App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/offers" element={<Offers />} />
    <Route path="/products" element={<Products />} />
    <Route path="/scraper" element={<Scraper />} />
  </Routes>
</BrowserRouter>
```

**API Client Pattern:**

```typescript
// api/client.ts
const API_BASE = '/api';

export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const res = await fetch(`${API_BASE}${url}`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  },
  
  post: async <T>(url: string, data?: any): Promise<T> => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  },
  
  put: async <T>(url: string, data?: any): Promise<T> => { /* ... */ },
  delete: async <T>(url: string): Promise<T> => { /* ... */ }
};

// api/offers.ts
export const offersApi = {
  getOffers: (params?: OffersParams) => 
    apiClient.get<Offer[]>(`/offers${buildQueryString(params)}`),
  
  getOffer: (id: number) => 
    apiClient.get<Offer>(`/offers/${id}`),
  
  updateStatus: (id: number, status: string) =>
    apiClient.put<Offer>(`/offers/${id}/status`, { status }),
};

// hooks/useOffers.ts
export function useOffers(status?: string, minMargin?: number) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    offersApi.getOffers({ status, min_margin: minMargin })
      .then(setOffers)
      .finally(() => setLoading(false));
  }, [status, minMargin]);
  
  return { offers, loading };
}
```

### 4. **Telegram Bot**

**Dateien:**
- `telegram-bot/bot.py` - FastAPI App mit Telegram Integration

**Funktionsweise:**

```python
# bot.py
class Settings(BaseSettings):
    telegram_bot_token: str | None = None
    telegram_chat_ids: str | None = None  # "12345,67890"

@app.get("/health")
async def health():
    return {"configured": is_configured, "chat_ids": [...]}

@app.post("/notify")
async def notify(payload: NotifyPayload):
    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    for chat_id in CHAT_IDS:
        await bot.send_message(chat_id=chat_id, text=payload.message)
    return {"detail": "Notification sent"}
```

**Backend Integration:**

```python
# backend/app/api/notifications.py
@router.post("/test")
async def test_notification():
    # Rufe Telegram-Bot Service auf
    response = requests.post(
        "http://telegram-bot:8001/notify",
        json={"message": "🔔 Test Notification from Margin Hunter"}
    )
    return {"detail": "Test notification sent"}
```

### 5. **Celery Worker**

**Dateien:**
- `backend/app/celery_config.py` - Celery Setup
- `backend/app/tasks.py` - Task Definitions (TODO)

**Konfiguration:**

```python
celery_app = Celery(
    "margin_hunter",
    broker="redis://redis:6379/0",      # Redis als Message Broker
    backend="redis://redis:6379/1"      # Redis als Result Backend
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 min max
)
```

**Verwendung:**

```python
# tasks.py
from app.celery_config import celery_app

@celery_app.task
def scrape_product_async(product_id: int):
    # Async Scraping-Task
    pass

# In API Endpoint:
from app.tasks import scrape_product_async

@router.post("/scraper/start-async")
async def start_scraper_async(product_id: int):
    task = scrape_product_async.delay(product_id)
    return {"task_id": task.id}
```

**Aktueller Status:**
- ✅ Celery Worker läuft
- ⚠️ Noch keine echten Tasks definiert
- 🔜 TODO: Scraper-Tasks von Backend delegieren

---

## 🗄️ Datenmodell

### Product Model

```python
class Product(Base):
    __tablename__ = "products"
    
    id: int                          # Primary Key
    name: str                        # "iPhone 15 Pro"
    category: str                    # "Electronics"
    brands: list[str]                # ["Apple"] (JSONB)
    filters: dict[str, Any]          # {"condition": "3000"} (JSONB)
    price_min: float                 # 800.0
    price_max: float                 # 1200.0
    active: bool                     # True/False (Scraper nutzt nur active=True)
    created_at: datetime
    updated_at: datetime
```

**Filters Beispiele:**
```json
{
  "condition": "3000",        // eBay: 1000=New, 3000=All
  "price_min": 500,
  "price_max": 1500,
  "shipping": "free",
  "location": "US"
}
```

### Offer Model

```python
class Offer(Base):
    __tablename__ = "offers"
    
    id: int                          # Primary Key
    product_id: int                  # Foreign Key → products.id
    
    # Angebot Info
    title: str                       # "iPhone 15 Pro 256GB - Wie Neu"
    price: float                     # 899.99
    url: str                         # UNIQUE! (Duplikat-Prevention)
    source_url: str | None           # Alias für url (Scraper)
    image_url: str | None
    seller_name: str | None
    location: str | None
    description: str | None
    
    # Scraper-Daten
    source: str                      # "ebay"
    shipping: float                  # 0.0 (Free Shipping)
    condition: str | None            # "New", "Used", "Refurbished"
    seller_rating: str | None        # "99.2% positive"
    
    # Status & Margin
    status: str                      # "new", "interesting", "contacted", "purchased", "ignored"
    margin_percent: float | None     # 15.5% (Gewinnmarge)
    geizhals_price: float | None     # 1050.00 (Referenzpreis)
    
    # Timestamps
    first_seen_at: datetime          # Wann erstmals gescraped
    last_checked_at: datetime        # Letzter Scrape-Check
    
    # Relationship
    product: Product                 # SQLAlchemy Relationship
```

### PriceHistory Model

```python
class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id: int                          # Primary Key
    offer_id: int                    # Foreign Key → offers.id
    price: float                     # 899.99
    recorded_at: datetime            # Timestamp des Price Checks
    
    # Relationship
    offer: Offer                     # SQLAlchemy Relationship
```

**Verwendung:**
- Jedes Mal wenn Scraper ein Offer aktualisiert → neuer PriceHistory Entry
- Frontend kann Preisverlauf als Chart anzeigen

---

## 🌐 API-Übersicht

### Health & Status

```bash
# Backend Health
GET /api/health
Response: {
  "status": "ok",
  "timestamp": "2025-12-10T10:30:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "celery": "ok"
  }
}

# Scraper Status
GET /api/scraper/status
Response: {
  "status": "idle",  # idle | running | ok | error
  "last_run_at": "2025-12-10T10:25:00Z",
  "last_error": null
}

# Telegram Bot Status
GET /api/notifications/status
Response: {
  "configured": true,
  "reachable": true,
  "chat_ids": [123456789]
}
```

### Offers API

```bash
# Get Offers (mit Filtern)
GET /api/offers?status=new&min_margin=10&limit=50&offset=0
Response: [
  {
    "id": 1,
    "product_id": 1,
    "title": "iPhone 15 Pro 256GB",
    "price": 899.99,
    "url": "https://ebay.com/itm/...",
    "source": "ebay",
    "status": "new",
    "margin_percent": 15.5,
    "geizhals_price": 1050.00,
    "first_seen_at": "2025-12-10T09:00:00Z",
    "last_checked_at": "2025-12-10T10:25:00Z"
  }
]

# Get Single Offer
GET /api/offers/{id}
Response: { /* Offer Object + Product Details */ }

# Update Offer Status
PUT /api/offers/{id}/status
Body: { "status": "interesting" }
Response: { /* Updated Offer */ }

# Get Price History
GET /api/offers/{id}/history
Response: [
  {
    "id": 1,
    "offer_id": 1,
    "price": 899.99,
    "recorded_at": "2025-12-10T09:00:00Z"
  },
  {
    "id": 2,
    "offer_id": 1,
    "price": 879.99,
    "recorded_at": "2025-12-10T10:25:00Z"
  }
]
```

### Products API

```bash
# Get All Products
GET /api/products
Response: [
  {
    "id": 1,
    "name": "iPhone 15 Pro",
    "category": "Electronics",
    "brands": ["Apple"],
    "filters": {"condition": "3000"},
    "price_min": 800.0,
    "price_max": 1200.0,
    "active": true,
    "created_at": "2025-12-01T00:00:00Z",
    "updated_at": "2025-12-01T00:00:00Z"
  }
]

# Create Product
POST /api/products
Body: {
  "name": "AirPods Pro 2",
  "category": "Electronics",
  "brands": ["Apple"],
  "filters": {"condition": "1000"},  # New only
  "price_min": 150.0,
  "price_max": 250.0,
  "active": true
}
Response: { /* Created Product */ }

# Update Product
PUT /api/products/{id}
Body: { "active": false }
Response: { /* Updated Product */ }

# Delete Product
DELETE /api/products/{id}
Response: 204 No Content
```

### Scraper API

```bash
# Start Scraper (Demo Mode)
POST /api/scraper/start
Response: {
  "detail": "Scraper run completed, created 3 offers."
}

# Stop Scraper (No-Op aktuell)
POST /api/scraper/stop
Response: {
  "detail": "Scraper stop requested (no-op for demo)"
}

# Run Once (Demo Scrape)
POST /api/scraper/run-once
Response: {
  "detail": "Scraper run completed, created 3 offers."
}
```

### Notifications API

```bash
# Get Status
GET /api/notifications/status
Response: {
  "configured": true,
  "reachable": true,
  "chat_ids": [123456789]
}

# Send Test Notification
POST /api/notifications/test
Response: {
  "detail": "Test notification sent to 1 chat(s)"
}
```

---

## 🚀 Deployment & Setup

### Voraussetzungen

- Docker & Docker Compose
- Python 3.11+ (für lokale Entwicklung)
- Node.js 18+ (für Frontend-Entwicklung)

### Quick Start (Docker)

```bash
# 1. Repository klonen
git clone https://github.com/your-repo/margin-hunter.git
cd margin-hunter

# 2. Environment Variables einrichten
cp env.example .env
nano .env  # Bearbeite .env mit deinen Credentials

# Wichtige Variablen:
# - TELEGRAM_BOT_TOKEN=your_bot_token
# - TELEGRAM_CHAT_IDS=123456789,987654321
# - DATABASE_URL=postgresql+asyncpg://margin_user:pass@postgres:5432/margin_hunter
# - REDIS_URL=redis://redis:6379/0

# 3. Services starten
docker compose up -d --build

# 4. Logs verfolgen
docker compose logs -f

# 5. Services überprüfen
docker compose ps
```

### URLs

Nach dem Start sind folgende URLs verfügbar:

- **Frontend:** http://localhost
- **API Docs (Swagger):** http://localhost/docs
- **Health Check:** http://localhost/api/health

### Demo-Daten seeden (Optional)

```bash
# In virtualenv (im Projekt-Root)
python3 -m venv .venv
source .venv/bin/activate
cd backend
pip install -r requirements.txt

# Seed Script ausführen
python -m scripts.seed_demo_data
```

Das erstellt:
- 3 Demo-Products (iPhone 15 Pro, AirPods Pro 2, DDR5 RAM)
- Mehrere Demo-Offers mit verschiedenen Status

### Lokale Entwicklung (ohne Docker)

```bash
# Terminal 1: Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# PostgreSQL & Redis müssen laufen (via Docker oder lokal)
export DATABASE_URL="postgresql+asyncpg://margin_user:pass@localhost:5432/margin_hunter"
export REDIS_URL="redis://localhost:6379/0"

uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev  # Vite Dev Server auf Port 5173

# Terminal 3: Scraper (manuell)
cd scraper
python main.py

# Terminal 4: Celery Worker
cd backend
celery -A app.celery_config worker -l info
```

### Production Deployment

**Empfohlenes Setup:**
- ✅ Use docker-compose.yml als Basis
- ✅ External PostgreSQL (z.B. AWS RDS, DigitalOcean Managed DB)
- ✅ External Redis (z.B. AWS ElastiCache)
- ✅ HTTPS via nginx + Let's Encrypt
- ✅ Environment Secrets via Docker Secrets oder Vault

**Änderungen für Production:**

```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}  # Starkes Secret!
      - DATABASE_URL=${EXTERNAL_DB_URL}
      - REDIS_URL=${EXTERNAL_REDIS_URL}
  
  nginx:
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro  # SSL Zertifikate
```

---

## 🐛 Troubleshooting

### Problem: Services starten nicht

```bash
# Services-Status prüfen
docker compose ps

# Logs ansehen
docker compose logs backend
docker compose logs scraper
docker compose logs postgres

# Einzelnen Service neu starten
docker compose restart backend

# Alles neu bauen
docker compose down
docker compose up -d --build
```

### Problem: Database Connection Failed

**Ursache:** PostgreSQL noch nicht ready

**Lösung:**

```bash
# Health Check manuell testen
docker compose exec postgres pg_isready -U margin_user -d margin_hunter

# Backend wartet auf DB via depends_on + healthcheck
# Siehe docker-compose.yml:
depends_on:
  postgres:
    condition: service_healthy
```

### Problem: Scraper findet keine Offers

**Mögliche Ursachen:**

1. **Keine aktiven Products:**
```bash
# Check DB
docker compose exec postgres psql -U margin_user -d margin_hunter
SELECT id, name, active FROM products;

# Aktiviere Products
UPDATE products SET active = true WHERE id = 1;
```

2. **eBay blockiert Requests:**
```bash
# Scraper Logs prüfen
docker compose logs scraper

# User-Agent ändern (ebay_scraper.py)
# Timeout erhöhen (config.py: EBAY_TIMEOUT)
```

3. **HTML Structure geändert:**
```python
# ebay_scraper.py anpassen
# CSS Selektoren aktualisieren:
items = soup.find_all("div", class_="s-item")  # Möglicherweise geändert
```

### Problem: Frontend zeigt keine Daten

**Debugging:**

   ```bash
# 1. Backend Health Check
curl http://localhost/api/health

# 2. API direkt testen
curl http://localhost/api/offers
curl http://localhost/api/products

# 3. Browser Console öffnen (F12)
# Netzwerk-Tab → Requests anschauen

# 4. nginx Logs
docker compose logs nginx

# 5. CORS Probleme?
# nginx.conf hat CORS Headers (allow_origins=*)
```

### Problem: Celery Worker läuft nicht

   ```bash
# Worker Status prüfen
docker compose logs celery-worker

# Celery Inspect
docker compose exec celery-worker celery -A app.celery_config inspect active

# Redis Connection testen
docker compose exec redis redis-cli ping
# Sollte "PONG" zurückgeben
```

### Problem: Telegram Notifications funktionieren nicht

   ```bash
# 1. Bot-Status prüfen
curl http://localhost/api/notifications/status

# 2. Bot-Service Health Check
docker compose exec telegram-bot curl localhost:8001/health

# 3. Test Notification senden
curl -X POST http://localhost/api/notifications/test

# 4. .env prüfen
# TELEGRAM_BOT_TOKEN=your_bot_token_here
# TELEGRAM_CHAT_IDS=123456789

# 5. Chat ID korrekt?
# Sende /start an deinen Bot
# Dann: curl https://api.telegram.org/bot<TOKEN>/getUpdates
# → Dort findest du deine Chat ID
```

---

## 📊 Performance Optimierungen

### Scraper

**Aktuell:**
- HTTP Requests (requests library)
- ~1-2 Sekunden pro Product
- BeautifulSoup Parsing

**Mögliche Verbesserungen:**
```python
# 1. Async HTTP mit aiohttp
async with aiohttp.ClientSession() as session:
    tasks = [scrape_product(session, p) for p in products]
    await asyncio.gather(*tasks)

# 2. Caching von Duplicate Checks
# Redis: SET offer:url:{hash(url)} 1 EX 3600

# 3. Bulk Inserts statt einzelne commits
session.bulk_insert_mappings(Offer, offers_data)
```

### Database

**Indizes:**
```sql
-- Bereits vorhanden
CREATE INDEX idx_offers_product_id ON offers(product_id);
CREATE UNIQUE INDEX idx_offers_url ON offers(url);

-- Empfohlen hinzufügen:
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_margin ON offers(margin_percent);
CREATE INDEX idx_offers_first_seen ON offers(first_seen_at DESC);
```

**Query Optimierung:**
```python
# Eager Loading für Relationships
offers = session.query(Offer)\
    .options(joinedload(Offer.product))\
    .filter(Offer.status == "new")\
    .all()
```

### Frontend

**Code Splitting:**
```tsx
// App.tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Offers = lazy(() => import('./pages/Offers'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/offers" element={<Offers />} />
  </Routes>
</Suspense>
```

**Memoization:**
```tsx
const filteredOffers = useMemo(() => {
  return offers.filter(o => 
    o.status === selectedStatus && 
    o.margin_percent >= minMargin
  );
}, [offers, selectedStatus, minMargin]);
```

---

## 🔐 Security Considerations

### Aktueller Status (Development)

- ⚠️ **Keine Authentifizierung** - Alle Endpoints offen
- ⚠️ **CORS: allow_origins=["*"]** - Alle Origins erlaubt
- ⚠️ **SECRET_KEY** in docker-compose.yml hartcodiert
- ⚠️ **DEBUG=True** in Production

### Production TODOs

```python
# 1. JWT Authentication
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

@router.get("/offers")
async def get_offers(token: str = Depends(security)):
    user = verify_jwt(token)  # Implement JWT verification
    if not user:
        raise HTTPException(401, "Unauthorized")
    # ...

# 2. CORS einschränken
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Nur deine Domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# 3. Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("/scraper/start")
@limiter.limit("5/minute")  # Max 5 Requests pro Minute
async def start_scraper(request: Request):
    # ...

# 4. Input Validation mit Pydantic
from pydantic import BaseModel, validator

class ProductCreate(BaseModel):
    name: str
    price_min: float
    price_max: float
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Name darf nicht leer sein')
        return v
    
    @validator('price_max')
    def price_max_must_be_greater(cls, v, values):
        if 'price_min' in values and v <= values['price_min']:
            raise ValueError('price_max muss größer als price_min sein')
        return v
```

---

## 📈 Roadmap / TODOs

### Kurzfristig (MVP)

- [x] Basis-Architektur (Docker Compose)
- [x] Backend API (FastAPI)
- [x] Frontend (React + Dark Mode)
- [x] eBay Scraper (HTTP + BeautifulSoup)
- [x] PostgreSQL Datenbank
- [x] Telegram Bot Integration
- [ ] **Automatische Notifications bei High-Margin Offers**
- [ ] **Scraper als Cron Job (alle X Stunden)**

### Mittelfristig

- [ ] Authentifizierung (JWT)
- [ ] Multi-User Support
- [ ] Kleinanzeigen.de Scraper
- [ ] Geizhals API Integration (echte Referenzpreise)
- [ ] Price Drop Alerts
- [ ] Export Funktionen (CSV, Excel)

### Langfristig

- [ ] ML-basierte Margin-Prediction
- [ ] Auto-Bidding auf eBay
- [ ] Mobile App (React Native)
- [ ] Analytics Dashboard (Profit Tracking)
- [ ] Browser Extension (Quick Add Products)

---

## 📝 Entwickler-Notizen

### Wichtige Konzepte

**1. Async vs Sync:**
- Backend: **Async** (FastAPI + asyncio + SQLAlchemy async)
- Scraper: **Sync** (requests + SQLAlchemy sync)
- Reason: Scraper läuft in separatem Container, keine Async-Benefits bei HTTP Scraping

**2. Database Sessions:**
```python
# Backend (Async)
async def get_session() -> AsyncSession:
    async with async_session_maker() as session:
        yield session

# Scraper (Sync)
session = SessionLocal()
try:
    # ... queries
finally:
    session.close()
```

**3. Status-Tracking:**
```python
# In-Memory (aktuell)
SCRAPER_STATUS = {"status": "idle", "last_run_at": None}

# TODO: Redis-Based
await redis_client.set("scraper:status", json.dumps(status))
```

**4. Error Handling:**
```python
# FastAPI
@router.get("/offers/{id}")
async def get_offer(id: int):
    offer = await session.get(Offer, id)
    if not offer:
        raise HTTPException(404, f"Offer {id} not found")
    return offer

# Scraper
try:
    offers = scraper.search_product(name, filters)
except Exception as e:
    logger.error(f"Scraping failed: {e}", exc_info=True)
    # Continue with next product
```

### Code Style

- **Backend:** PEP 8, Type Hints, async/await
- **Frontend:** Prettier, ESLint, Functional Components + Hooks
- **Imports:** Absolute imports bevorzugen
- **Logging:** Strukturiert (structlog im Backend, Python logging im Scraper)

---

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

---

## 📄 Lizenz

Dieses Projekt ist unter der MIT Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

---

## 🙏 Danksagungen

- **FastAPI** - Moderne Python API Framework
- **React** - UI Library
- **SQLAlchemy** - ORM
- **BeautifulSoup** - HTML Parsing
- **Docker** - Containerisierung

---

**Made with ❤️ by Margin Hunter Team**
