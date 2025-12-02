# Margin Hunter - Setup & Konfiguration

## ✅ Überprüfte Komponenten

### 1. Docker & Docker Compose
- ✅ `docker-compose.yml` korrekt konfiguriert
- ✅ Alle Services definiert (backend, scraper, telegram-bot, frontend, postgres, redis)
- ✅ Dockerfiles erstellt für alle Services
- ✅ Volumes für persistente Daten konfiguriert

### 2. Datenbank (PostgreSQL)
- ✅ Container läuft (`margin-hunter-postgres-1`)
- ✅ Credentials: `user` / `pass`
- ✅ Datenbank: `margin_hunter`
- ✅ Port: `5432` (exponiert)
- ⚠️ **Hinweis**: Es gibt einen zusätzlichen `postgres` Container (manuell erstellt), der entfernt werden kann

### 3. Redis
- ✅ Container läuft (`margin-hunter-redis-1`)
- ✅ Port: `6379` (exponiert)
- ✅ Verbindung getestet (PONG)

### 4. Backend-Konfiguration
- ✅ `backend/app/config.py` verwendet Pydantic v2
- ✅ Environment-Variablen werden bevorzugt (vor .env-Datei)
- ✅ `.env`-Datei wird als Fallback geladen (nur wenn existiert)
- ✅ SECRET_KEY-Validierung implementiert (Production-Sicherheit)
- ✅ DATABASE_URL optional (für lokale Entwicklung ohne DB)

### 5. Sicherheit
- ✅ Kein hardcodierter SECRET_KEY mehr
- ✅ Production-Validierung: Fehler wenn SECRET_KEY fehlt
- ✅ Development-Warnung wenn SECRET_KEY fehlt

## 📋 Environment-Variablen Setup

### Für Docker Compose (Projekt-Root `.env`)
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/margin_hunter
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here
DEBUG=True
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_IDS=123456789,987654321
```

### Für lokale Entwicklung (`backend/.env`)
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/margin_hunter
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=dev-secret-key
DEBUG=True
```

**Wichtig:** 
- Docker verwendet Service-Namen (`postgres`, `redis`)
- Lokale Entwicklung verwendet `localhost`

## 🚀 Starten

### Mit Docker Compose
```bash
# 1. Erstelle .env im Projekt-Root (siehe oben)
# 2. Starte alle Services
docker compose up -d --build

# Services erreichbar:
# - Backend: http://localhost:8000
# - Frontend: http://localhost:5173
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Lokale Entwicklung
```bash
# 1. Erstelle backend/.env (siehe oben)
# 2. Starte PostgreSQL & Redis (Docker oder lokal)
docker compose up -d postgres redis

# 3. Starte Backend
cd backend
python -m app.main
```

## 🔍 Bekannte Probleme & Lösungen

### Problem: Doppelte PostgreSQL-Container
**Lösung:** Entferne den manuell erstellten Container:
```bash
docker stop postgres
docker rm postgres
```

### Problem: DATABASE_URL wird nicht geladen
**Lösung:** 
- Prüfe, ob `.env`-Datei existiert
- Prüfe Encoding (sollte ASCII/UTF-8 sein)
- Environment-Variablen haben Priorität über .env-Datei

### Problem: Passwort-Authentifizierung schlägt fehl
**Lösung:**
- Container neu erstellen (löscht altes Volume)
- Oder Passwort in PostgreSQL zurücksetzen

## 📝 Nächste Schritte

1. ✅ Backend läuft
2. ⏳ Scraper implementieren
3. ⏳ Telegram-Bot implementieren
4. ⏳ Frontend aufsetzen
5. ⏳ API-Endpunkte testen

