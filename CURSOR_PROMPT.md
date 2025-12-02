# Margin Hunter - Cursor AI Prompt für vollständiges Production-Setup

## Projekt-Übersicht

Margin Hunter ist ein web-basiertes Arbitrage-Tool zum Scrapen von Kleinanzeigen, Berechnung von Gewinnmargen (vs. Geizhals/Idealo) und automatischer Kontaktaufnahme mit Verkäufern.

## Tech-Stack

- **Backend**: FastAPI (async), SQLAlchemy 2.0, PostgreSQL, Redis, Celery, Pydantic
- **Frontend**: React 18, Vite 5, Tailwind CSS, shadcn/ui, Zustand, React Query
- **Scraper**: BeautifulSoup4, Celery Worker
- **Telegram Bot**: python-telegram-bot oder aiogram
- **Infrastructure**: Docker & Docker Compose, nginx (Reverse Proxy)

## Architektur-Übersicht

```
margin-hunter/
├── backend/          # FastAPI Backend (Port 8000 intern)
├── frontend/         # React Frontend (Port 5173 Dev, static in Production)
├── scraper/          # Celery Worker für Scraping-Tasks
├── telegram-bot/     # Telegram Bot Service (Webhook)
├── nginx/            # Reverse Proxy Konfiguration (Port 80)
└── docker-compose.yml
```

## WICHTIG: Datenbank-Konfiguration

**KRITISCH**: Das Backend benötigt ZWEI Datenbank-URLs:

1. **DATABASE_URL** (async): `postgresql+asyncpg://user:pass@postgres:5432/margin_hunter`
   - Für FastAPI async Endpoints
   - Verwendet asyncpg Driver

2. **DATABASE_URL_SYNC** (sync): `postgresql://user:pass@postgres:5432/margin_hunter`
   - Für Celery Tasks (Celery benötigt sync SQLAlchemy!)
   - Verwendet psycopg2 Driver (bereits in requirements.txt)

**Implementiere beide Engines in `backend/app/database.py`!**

## Backend-Anforderungen (FastAPI)

### Dateien-Struktur

```
backend/
├── Dockerfile
├── requirements.txt
└── app/
    ├── __init__.py
    ├── main.py          # FastAPI App + Health Check
    ├── config.py        # Settings mit DATABASE_URL und DATABASE_URL_SYNC
    ├── database.py      # Async UND Sync Engines
    ├── api/
    │   ├── __init__.py
    │   ├── offers.py    # CRUD für Angebote
    │   ├── products.py  # CRUD für Produkte
    │   └── scraper.py   # Scraper Control Endpoints
    ├── models/
    │   ├── __init__.py
    │   ├── product.py
    │   ├── offer.py
    │   ├── price_history.py
    │   └── contact.py
    └── schemas/
        ├── __init__.py
        └── (Pydantic Schemas)
```

### main.py Anforderungen

- FastAPI App mit async Lifespan
- Health Check Endpoint: `GET /health` → `{"status": "ok", "database": "connected"}`
- CORS Middleware konfiguriert
- API Router einbinden
- Structlog für Logging

### database.py Anforderungen

**WICHTIG**: Implementiere BEIDE Engines:

```python
# Async Engine für FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
async_engine = create_async_engine(settings.database_url, ...)

# Sync Engine für Celery
from sqlalchemy import create_engine
sync_engine = create_engine(settings.database_url_sync, ...)
```

### config.py Anforderungen

- Settings Klasse mit Pydantic Settings
- `database_url: str | None` (async)
- `database_url_sync: str | None` (sync)
- `redis_url: str | None`
- `secret_key: str | None`
- `debug: bool = False`
- `.env` File Support
- Production-Sicherheitsvalidierung

### API-Endpunkte

**Offers API** (`/api/offers`):
- `GET /api/offers` - Liste mit Filtern (status, min_margin, etc.)
- `GET /api/offers/{id}` - Einzelnes Angebot
- `POST /api/offers` - Neues Angebot erstellen
- `PUT /api/offers/{id}` - Angebot aktualisieren
- `DELETE /api/offers/{id}` - Angebot löschen

**Products API** (`/api/products`):
- `GET /api/products` - Liste aller Produkte
- `GET /api/products/{id}` - Einzelnes Produkt
- `POST /api/products` - Neues Produkt
- `PUT /api/products/{id}` - Produkt aktualisieren

**Scraper API** (`/api/scraper`):
- `POST /api/scraper/start` - Scraper starten (triggert Celery Task)
- `GET /api/scraper/status` - Status abfragen
- `POST /api/scraper/stop` - Scraper stoppen

## Scraper-Anforderungen (Celery Worker)

### Dateien-Struktur

```
scraper/
├── Dockerfile
├── requirements.txt    # Celery, BeautifulSoup4, requests, etc.
├── main.py            # Celery App Setup
└── tasks.py           # Celery Tasks
```

### main.py Anforderungen

- Celery App initialisieren
- Redis als Broker: `redis://redis:6379/0`
- Sync Database Connection (SQLAlchemy sync)
- Structured Logging

### tasks.py Anforderungen

- `scrape_kleinanzeigen()` - Haupt-Scraping-Task
- `calculate_margins()` - Margen-Berechnung gegen Geizhals/Idealo
- `send_contact_message()` - Automatische Kontaktaufnahme

**WICHTIG**: Tasks müssen sync SQLAlchemy verwenden (nicht async!)

## Frontend-Anforderungen (React + Vite)

### Dateien-Struktur

```
frontend/
├── Dockerfile          # Production: nginx für Static Files
├── nginx.conf          # Nginx Config für Static Files
├── vite.config.js
├── package.json
└── src/
    ├── App.tsx
    ├── main.tsx
    └── (React Components)
```

### Dockerfile Anforderungen

**Development**:
- Node 20 Alpine
- Vite Dev Server auf Port 5173
- Hot Reload

**Production**:
- Multi-Stage Build
- Build Stage: npm run build
- Serve Stage: nginx Alpine für Static Files

### vite.config.js

- Proxy zu Backend: `/api` → `http://backend:8000`
- React Plugin
- Environment Variables Support

## Telegram Bot Anforderungen

### Dateien-Struktur

```
telegram-bot/
├── Dockerfile
├── requirements.txt
├── main.py        # Bot Setup (Webhook oder Polling)
└── handlers.py    # Message Handlers
```

### main.py Anforderungen

- Telegram Bot Initialisierung
- Webhook Setup (für Production)
- Notification Handler für neue Angebote
- Environment: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS

## Docker Compose Konfiguration

### Services

1. **nginx** - Reverse Proxy (Port 80)
   - Proxy zu Backend: `/api/*` → `http://backend:8000`
   - Serve Frontend: `/` → Static Files oder `http://frontend:5173`

2. **backend** - FastAPI (Port 8000 intern)
   - Depends on: postgres, redis
   - Health Check

3. **scraper** - Celery Worker
   - Depends on: backend, redis
   - Command: `celery -A main worker --loglevel=info`

4. **telegram-bot** - Telegram Bot
   - Depends on: backend
   - Webhook oder Polling

5. **frontend** - React App
   - Port 5173 (Dev) oder Static Files via nginx (Prod)

6. **postgres** - PostgreSQL 16
   - Port 5432 (nur intern!)
   - Volume: postgres_data

7. **redis** - Redis 7
   - Port 6379 (nur intern!)
   - Persistence konfiguriert

### Port-Mapping (Production)

**WICHTIG**: Nur Port 80 nach außen exponieren!
- ✅ Port 80: nginx (HTTP)
- ❌ Port 8000: NICHT nach außen
- ❌ Port 5432: NICHT nach außen
- ❌ Port 6379: NICHT nach außen

## Code-Standards

### Python

- Type Hints überall
- Async/Await korrekt verwenden
- Structured Logging mit Structlog
- Pydantic für Validation
- SQLAlchemy 2.0 Style

### React/TypeScript

- TypeScript strict mode
- Functional Components
- Hooks für State Management
- React Query für API Calls
- Tailwind CSS für Styling

### Allgemein

- Environment Variables für alle Secrets
- Keine hardcodierten Credentials
- Error Handling überall
- Health Checks für alle Services

## Datenbank-Schema

### Models

**Product**:
- id (Primary Key)
- name (String)
- ean (String, optional)
- idealo_url (String, optional)
- geizhals_url (String, optional)
- created_at (DateTime)
- updated_at (DateTime)

**Offer**:
- id (Primary Key)
- product_id (ForeignKey → Product)
- title (String)
- url (String, unique)
- price (Float)
- location (String, optional)
- status (Enum: new, contacted, sold, expired)
- margin (Float, optional)
- created_at (DateTime)
- updated_at (DateTime)

**PriceHistory**:
- id (Primary Key)
- product_id (ForeignKey → Product)
- price (Float)
- source (String: idealo/geizhals)
- recorded_at (DateTime)

**Contact**:
- id (Primary Key)
- offer_id (ForeignKey → Offer)
- message_sent (String)
- sent_at (DateTime)
- response_received (Boolean)

## Environment Variables (.env)

```env
# Database (Async für FastAPI)
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/margin_hunter

# Database (Sync für Celery) - WICHTIG!
DATABASE_URL_SYNC=postgresql://user:pass@postgres:5432/margin_hunter

# Redis
REDIS_URL=redis://redis:6379/0

# Secrets
SECRET_KEY=generate-with-secrets-token-urlsafe-32

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_IDS=123456789,987654321

# Kleinanzeigen
KLEINANZEIGEN_EMAIL=your-email@example.com
KLEINANZEIGEN_PASSWORD=your-password

# Settings
DEBUG=False
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

## Deployment-Checkliste

1. ✅ Docker Compose Dateien prüfen
2. ✅ Environment Variables setzen
3. ✅ Database Migrations (später mit Alembic)
4. ✅ Health Checks testen
5. ✅ Reverse Proxy konfigurieren
6. ✅ SSL Zertifikate (optional, später)

## WICHTIGE HINWEISE

1. **DATABASE_URL_SYNC** MUSS sync sein (postgresql:// nicht postgresql+asyncpg://)
2. Celery Tasks MÜSSEN sync SQLAlchemy verwenden
3. FastAPI Endpoints bleiben async
4. Nur Port 80 nach außen exponieren in Production
5. Alle Secrets über Environment Variables
6. Health Check Endpoint: `/health`

## Start-Anweisungen

Nach der Implementierung sollte folgendes funktionieren:

```bash
# 1. Environment setup
cp .env.example .env
# Bearbeite .env mit echten Werten

# 2. Docker Compose starten
docker-compose up -d --build

# 3. Health Check
curl http://localhost:8000/health

# 4. Frontend
curl http://localhost  # Via nginx
```

## Nächste Schritte nach diesem Setup

1. Alembic für Database Migrations
2. SSL/HTTPS Setup (Let's Encrypt)
3. Monitoring (Prometheus, Grafana)
4. Backup-Strategie für PostgreSQL
5. Log Aggregation

---

**Viel Erfolg beim Implementieren! 🚀**

