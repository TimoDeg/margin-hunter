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

### Schnellstart (sobald alle Services implementiert sind)
```bash
cp .env.example .env  # Beispiel, Datei muss lokal angelegt werden
docker-compose up -d
```

Geplante Ports:
- Backend: `http://localhost:8000` (Swagger: `/docs`)
- Frontend (Dev, Vite): `http://localhost:5173`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

# margin-hunter
hunting big boy margins
