## Margin Hunter

Ein web-basiertes Arbitrage-Tool zum Scrapen von Kleinanzeigen (bzw. Demo-Daten), Berechnung von Gewinnmargen und optionaler Benachrichtigung via Telegram.  
Aktuell ist das Projekt auf **lokale Entwicklung mit Docker Compose** optimiert.

---

### Architektur-Überblick

- **Backend (FastAPI)** – `backend/`
  - REST-API unter `/api/*`
  - DB-Zugriff via SQLAlchemy 2.0 auf PostgreSQL
  - Wichtige Endpoints:
    - `GET /api/health` – Health-Check inkl. DB-Status
    - `GET /api/offers` – Liste von Offers (mit Filtern)
    - `GET /api/products` – Produkte
    - `GET /api/scraper/status` – aktueller Scraper-Status
    - `POST /api/scraper/run-once` – **Demo-Scrape-Lauf** (erzeugt Demo-Offers aus vorhandenen Products)
    - `GET /api/notifications/status` – Telegram-Bot-Status (konfiguriert/erreichbar)
    - `POST /api/notifications/test` – Testnachricht an den Telegram-Bot

- **Frontend (React + Vite + Tailwind)** – `frontend/`
  - Dark-Mode Dashboard, ausgeliefert über den `frontend`-Container (nginx).
  - Routen (SPA via React Router):
    - `/` – Dashboard (Health-Status und später KPIs)
    - `/offers` – Offers-Tabelle (Filter, Statuswechsel)
    - `/products` – Product-Management (CRUD)
    - `/scraper` – Scraper-Steuerung (Status + Start/Stop/Run-Once)

- **Scraper-Service** – `scraper/`
  - Aktuell **kein produktiver Scraper-Code im Repo** (nur Dockerfile + requirements).
  - Die Demo-Scrape-Funktionalität wird direkt im Backend über `POST /api/scraper/run-once` umgesetzt.

- **Telegram-Bot-Service** – `telegram-bot/`
  - FastAPI-App `bot:app` auf Port `8001` (im Container).
  - Endpoints:
    - `GET /health` – ob Bot konfiguriert ist (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_IDS`).
    - `POST /notify` – sendet Textnachricht an alle konfigurierten Chat-IDs.
  - Das Backend ruft diesen Service intern unter `http://telegram-bot:8001` an.

- **PostgreSQL + Redis**
  - `postgres` – Hauptdatenbank (`offers`, `products`, etc.).
  - `redis` – aktuell primär für spätere Queue/Status-Mechanismen vorgesehen.

- **nginx** – `nginx/nginx.conf`
  - Reverse Proxy:
    - `/api/*` → `backend:8000`
    - `/health` → `backend:8000/health`
    - `/docs`, `/openapi.json` → `backend:8000`
    - alle anderen Pfade `/...` → `frontend:80` (SPA-Fallback, damit Refresh auf `/offers`, `/scraper`, etc. funktioniert)

---

### Aktueller Funktionsstand

- **Läuft stabil in Docker Compose**:
  - `docker compose up -d --build` startet:
    - `backend`, `frontend`, `nginx`, `postgres`, `redis`, `scraper` (Stub), `telegram-bot`.

- **Backend-Features**:
  - Health-Check (`/api/health`) inkl. DB-Status.
  - Offers-API (`/api/offers`, `/api/offers/{id}`, `/api/offers/{id}/history`, Status-Update).
  - Products-API (`/api/products` CRUD).
  - Scraper-Demo:
    - `POST /api/scraper/run-once` erzeugt Demo-Offers basierend auf **aktiven Products**.
    - `GET /api/scraper/status` zeigt in-memory-Status (`idle`/`running`/`ok`/`error`, `last_run_at`, `last_error`).
  - Telegram-Notifications:
    - Backend weiß, ob der Bot konfiguriert + erreichbar ist (`/api/notifications/status`).
    - `POST /api/notifications/test` sendet über den Bot eine Testnachricht an alle Chat-IDs.

- **Frontend-Features** (Dark-Mode Dashboard):
  - Layout: Sidebar-Navigation (Dashboard, Offers, Products, Scraper) + Topbar.
  - Dashboard:
    - Zeigt Backend-Health (Status, DB-Verbindung).
  - Offers:
    - Tabelle mit Offers (Titel, Preis, Margin, Status, Link).
    - Filter nach Status + min. Margin.
    - Detailbereich mit Beschreibung, Seller, Location, Preisverlauf.
    - Statuswechsel über Select (sendet `PUT /api/offers/{id}/status`).
  - Products:
    - Tabelle aller Produkte (Name, Kategorie, Preis-Min/Max, Aktiv).
    - Formular zum Erstellen/Bearbeiten/Löschen (CRUD).
  - Scraper:
    - Zeigt `status`, `last_run_at`, `last_error` aus `/api/scraper/status`.
    - Buttons:
      - „Starten“ → aktuell einmaliger Demo-Lauf (`/api/scraper/start` → intern `run-once`).
      - „Stoppen“ → setzt Status auf `idle` (noch kein echter Worker-Stop).

- **Telegram-Bot**:
  - Läuft als HTTP-Service, kein Polling/Webhook-Bot im klassischen Sinn (noch).
  - Kann über `/notify` Textnachrichten versenden, wenn Token + Chat-IDs gesetzt sind.
  - Das Backend nutzt ihn **nur für Testnachrichten**; automatische Offer-Notifications sind noch nicht verdrahtet.

---

### Bekannte Lücken / TODOs

Diese Punkte sind (Stand jetzt) **noch nicht fertig** und sollten von einer AI oder einem Entwickler bei der Weiterarbeit beachtet werden:

1. **Echter Scraper-Code**
   - Im Ordner `scraper/` fehlen jede Art von Scrape-/Parsing-Funktionalität.
   - Die aktuelle Demo-Scrape-Logik steckt direkt im Backend (`backend/app/api/scraper.py` → `_run_demo_scrape`).
   - TODO:
     - Echten Scraper in `scraper/` implementieren (z.B. Kleinanzeigen), der:
       - Product-Filters (`Product.filters`) verwendet.
       - Offers/PriceHistory in die DB schreibt.
     - Backend-Scraper-API so umbauen, dass sie Tasks an den Scraper-Service delegiert, statt Demo-Daten selbst zu erzeugen.

2. **Telegram-Benachrichtigungen in echten Flows**
   - Aktuell gibt es nur:
     - `/api/notifications/status`
     - `/api/notifications/test`
   - Es gibt **keine** automatische Notification bei realen Events (z.B. neues High-Margin-Offer).
   - TODO:
     - Logik definieren (z.B. in `create_offer`), wann eine Notification ausgelöst werden soll (Threshold, Produktkategorie etc.).
     - Anbindung an den Bot-HTTP-Service (`/notify`) bauen.

3. **Scraper-Status über In-Memory**
   - Scraper-Status liegt aktuell nur im Modul-Level-Dict `SCRAPER_STATUS`.
   - Das ist für einen Container-Restart oder mehrere Instanzen nicht robust.
   - TODO:
     - Status in Redis oder einer eigenen DB-Tabelle (`scraper_runs`) speichern.
     - `/api/scraper/status` aus dieser Quelle lesen.

4. **UI-Feinschliff**
   - Dark-Mode-Grundlayout steht, aber:
     - Buttons sind noch teils inline gestylt (kein einheitliches Button-Component).
     - Keine globalen Toast-/Notification-Komponenten für Fehler/Erfolg (z.B. bei Status-Updates, Scraper-Lauf, Telegram-Test).
     - Dashboard-KPIs sind minimal (weitere Charts/Karten möglich).
   - TODO:
     - Einheitliche Button-Komponente (Primär/Sekundär/Danger).
     - Globale Toasts (z.B. über ein leichtgewichtiges UI-Framework oder eigene Implementierung).
     - Bessere Leere-/Fehlerzustände (Skeletons, erklärende Texte).

5. **Tests**
   - Es gibt aktuell keine formalen Tests im Repo (weder Backend noch Frontend).
   - TODO:
     - FastAPI-Tests für Offers/Products/Scraper/Notifications.
     - React Testing Library für kritische Screens (Offers, Products, Scraper).
     - E2E-Tests (z.B. mit Playwright/Cypress), wenn gewünscht.

6. **Security / Production-Härtung**
   - `.env`-Handling ist für Dev/Single-Server ausreichend, aber:
     - `SECRET_KEY` wird in Dev akzeptiert, auch wenn leer (mit Warnung).
     - CORS im Backend ist sehr offen (`allow_origins=["*"]`).
   - TODO:
     - CORS für Production einschränken.
     - Secrets/Env über ein Secret-Management-System verwalten (Vault, Docker Secrets o.ä.).

---

### Voraussetzungen

- Docker & Docker Compose
- Python 3.11+ (für lokale Skripte/Tests)
- Node.js (für lokalem Frontend-Dev, falls nötig)

---

### Schnellstart (Docker)

1. **Environment-Variablen einrichten:**

   ```bash
   # Im Projekt-Root
   cp env.example .env
   # .env bearbeiten und Datenbank/Secrets, Telegram-Bot, Kleinanzeigen-Creds anpassen
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
   - Scraper-Status: `http://localhost/api/scraper/status`
   - Notifications-Status: `http://localhost/api/notifications/status`
   - Swagger: `http://localhost/docs`

---

Geplante / relevante Ports:
- Backend: `8000` (intern, via nginx)
- Frontend: `80` (nginx im `frontend`-Container, via nginx-Reverse-Proxy nach außen)
- PostgreSQL: `5432` (intern)
- Redis: `6379` (intern)
- Telegram-Bot: `8001` (intern, via Service-Namen `telegram-bot`)

# margin-hunter
hunting big boy margins
