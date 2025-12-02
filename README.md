## Margin Hunter

Ein web-basiertes Arbitrage-Tool zum Scrapen von Kleinanzeigen, Berechnung von Gewinnmargen (vs. Geizhals/Idealo) und automatischer Kontaktaufnahme mit Verkäufern.

### Features (geplant)
- **Dashboard**: Übersicht, Statistiken, letzte Angebote.
- **Offers**: Angebotsliste mit Filtern und Sortierung.
- **Products**: Produkt-Management.
- **Settings**: Konfiguration und API-Keys.

### Tech-Stack
- **Backend**: FastAPI (async), SQLAlchemy 2.0, PostgreSQL, Redis, Celery, Pydantic.
- **Frontend**: React 18, Vite 5, Tailwind CSS, shadcn/ui, Zustand, React Query.
- **Weitere Services**: Telegram Bot, Scraper (BeautifulSoup4), Docker & Docker Compose.

### Entwicklung (Phase 1–3)
1. Basis-Struktur und Backend (FastAPI + PostgreSQL + Redis) aufsetzen.
2. Docker-Compose mit allen Services.
3. Schrittweise Implementierung von Scraper, Telegram-Bot und Frontend.

### Voraussetzungen
- Docker & Docker Compose
- Python 3.11+
- Node.js (für das Frontend-Dev-Setup, später)

### Schnellstart

1. **Environment-Variablen einrichten:**
   ```bash
   # Erstelle .env-Datei im Projekt-Root (für Docker Compose)
   # Für lokale Entwicklung: Erstelle backend/.env
   ```

   **Wichtig:** 
   - Für **Docker**: `.env` im Projekt-Root mit `DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/margin_hunter`
   - Für **lokale Entwicklung**: `backend/.env` mit `DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/margin_hunter`

2. **Docker Compose starten:**
   ```bash
   docker compose up -d --build
   ```

3. **Oder lokal entwickeln:**
   ```bash
   cd backend
   python -m app.main
   ```

Geplante Ports:
- Backend: `http://localhost:8000` (Swagger: `/docs`)
- Frontend (Dev, Vite): `http://localhost:5173`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

# margin-hunter
hunting big boy margins
