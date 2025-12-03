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

### Schnellstart (Docker)

1. **Environment-Variablen einrichten:**

   ```bash
   # Im Projekt-Root
   cp env.example .env
   # .env bearbeiten und Datenbank/Secrets anpassen
   ```

2. **Services starten:**

   ```bash
   docker compose up -d --build
   ```

3. **Optional: Demo-Daten seeden (lokal mit venv):**

   ```bash
   cd backend
   python3 -m venv ../.venv
   source ../.venv/bin/activate
   pip install -r requirements.txt
   python -m scripts.seed_demo_data
   ```

4. **Aufruf im Browser:**

   - Frontend: `http://localhost`
   - API Health: `http://localhost/api/health`
   - Swagger: `http://localhost/docs`

Geplante Ports:
- Backend: `http://localhost:8000` (Swagger: `/docs`)
- Frontend (Dev, Vite): `http://localhost:5173`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

# margin-hunter
hunting big boy margins
