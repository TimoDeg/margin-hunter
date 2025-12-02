# Margin Hunter - Quick Start Checkliste

## Schnellstart in 5 Minuten

### Voraussetzungen

- ✅ Docker & Docker Compose installiert
- ✅ Git installiert
- ✅ SSH-Zugriff auf Ubuntu VM

### Schritt 1: Repository klonen (1 Min)

```bash
cd /home/$USER
git clone https://github.com/TimoDeg/margin-hunter.git
cd margin-hunter
```

### Schritt 2: Environment Setup (2 Min)

```bash
# Template kopieren
cp env.example .env

# Secret Key generieren
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))" >> .env

# Bearbeite .env und füge deine Secrets hinzu
nano .env
```

**Mindest-Konfiguration**:
- `SECRET_KEY` (generiert)
- `TELEGRAM_BOT_TOKEN` (optional)
- `TELEGRAM_CHAT_IDS` (optional)
- `KLEINANZEIGEN_EMAIL` (optional)
- `KLEINANZEIGEN_PASSWORD` (optional)

### Schritt 3: Services starten (2 Min)

```bash
# Build & Start
docker compose up -d --build

# Status prüfen
docker compose ps
```

### Schritt 4: Verifizierung (1 Min)

```bash
# Health Check
curl http://localhost:8000/health

# Erwartete Antwort:
# {"status":"ok","database":"connected"}
```

## Checkliste

### Vor dem Start

- [ ] Docker installiert (`docker --version`)
- [ ] Docker Compose installiert (`docker compose version`)
- [ ] `.env` Datei erstellt und gefüllt
- [ ] Port 80 frei (Firewall erlauben: `sudo ufw allow 80/tcp`)

### Nach dem Start

- [ ] Alle Container laufen (`docker compose ps`)
- [ ] Health Check erfolgreich (`curl http://localhost:8000/health`)
- [ ] Backend erreichbar (`curl http://localhost:8000/`)
- [ ] Frontend erreichbar (`curl http://localhost`)

### Wichtigste Befehle

```bash
# Services starten
docker compose up -d

# Services stoppen
docker compose down

# Logs anschauen
docker compose logs -f

# Einzelnen Service neu starten
docker compose restart backend

# In Container einloggen
docker compose exec backend /bin/bash
```

## Health Check Endpoints

```bash
# Backend Health (intern)
curl http://localhost:8000/health

# Backend Health (via nginx)
curl http://localhost/api/health

# Frontend (via nginx)
curl http://localhost

# PostgreSQL
docker compose exec postgres psql -U user -d margin_hunter -c "SELECT 1;"

# Redis
docker compose exec redis redis-cli ping
```

## Schnelle Troubleshooting

### Problem: Container startet nicht

```bash
# 1. Logs prüfen
docker compose logs <service-name>

# 2. Neu bauen
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Problem: Port belegt

```bash
# Prüfe belegte Ports
sudo netstat -tulpn | grep -E ':(80|8000)'

# Stoppe andere Services oder ändere Port in docker-compose.yml
```

### Problem: Database Connection Error

```bash
# PostgreSQL neu starten
docker compose restart postgres backend

# Logs prüfen
docker compose logs postgres
docker compose logs backend
```

### Problem: nginx 502 Error

```bash
# Backend prüfen
docker compose ps backend
docker compose logs backend

# nginx neu starten
docker compose restart nginx
```

## Port-Übersicht

| Service | Port (intern) | Port (extern) | Status |
|---------|---------------|---------------|--------|
| nginx | 80 | 80 | ✅ Öffentlich |
| Backend | 8000 | - | 🔒 Intern |
| Frontend | 5173 | - | 🔒 Intern |
| PostgreSQL | 5432 | - | 🔒 Intern |
| Redis | 6379 | - | 🔒 Intern |

**WICHTIG**: Nur Port 80 sollte nach außen exponiert sein!

## Environment-Variablen Schnellreferenz

```env
# Minimum für Start
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/margin_hunter
DATABASE_URL_SYNC=postgresql://user:pass@postgres:5432/margin_hunter
REDIS_URL=redis://redis:6379/0
SECRET_KEY=<generiere-mit-secrets-token-urlsafe-32>
DEBUG=False
```

## Nächste Schritte

1. ✅ Services laufen
2. ⏳ Scraper konfigurieren (siehe README_SETUP.md)
3. ⏳ Telegram Bot einrichten
4. ⏳ Frontend anpassen
5. ⏳ SSL/HTTPS einrichten (optional)

## Weitere Dokumentation

- **Detaillierte Anleitung**: `README_SETUP.md`
- **Deployment-Checkliste**: `DEPLOYMENT_CHECKLIST.md`
- **Cursor AI Prompt**: `CURSOR_PROMPT.md`

---

**Ready to hunt margins! 💰**

