# Margin Hunter - Detaillierte Setup-Anleitung

## Übersicht

Diese Anleitung führt dich Schritt für Schritt durch das komplette Setup von Margin Hunter auf einer Ubuntu VM mit Docker.

## Voraussetzungen

### Hardware
- Ubuntu Server 20.04+ (22.04 LTS empfohlen)
- Mindestens 2 GB RAM
- 10 GB freier Festplattenspeicher
- Internet-Verbindung

### Software
- SSH-Zugriff auf die VM
- Root- oder sudo-Berechtigungen
- Git installiert

## Phase 1: Ubuntu VM Vorbereitung

### 1.1 System aktualisieren

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Docker installieren

```bash
# Alte Docker-Versionen entfernen (falls vorhanden)
sudo apt remove docker docker-engine docker.io containerd runc -y

# Docker Repository hinzufügen
sudo apt install ca-certificates curl gnupg lsb-release -y
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Docker ohne sudo starten (optional, für bessere UX)
sudo usermod -aG docker $USER
newgrp docker  # Oder neu einloggen

# Docker Version prüfen
docker --version
docker compose version
```

### 1.3 Firewall konfigurieren (UFW)

```bash
# SSH Port behalten
sudo ufw allow 22/tcp

# HTTP Port öffnen (für nginx)
sudo ufw allow 80/tcp

# HTTPS Port öffnen (optional, für später)
sudo ufw allow 443/tcp

# Firewall aktivieren
sudo ufw enable
sudo ufw status
```

**WICHTIG**: Öffne NICHT die Ports 8000, 5432, 6379 nach außen! Diese sind nur intern über nginx erreichbar.

## Phase 2: Repository Setup

### 2.1 Projekt klonen

```bash
cd /home/$USER
git clone https://github.com/TimoDeg/margin-hunter.git
cd margin-hunter
```

### 2.2 Projektstruktur prüfen

```bash
ls -la
# Sollte enthalten: docker-compose.yml, backend/, frontend/, scraper/, etc.
```

## Phase 3: Environment-Variablen konfigurieren

### 3.1 .env-Datei erstellen

```bash
# Kopiere das Template
cp env.example .env

# Bearbeite die Datei
nano .env
```

### 3.2 Secrets generieren

```bash
# Secret Key generieren
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
# Kopiere den Output in deine .env-Datei
```

### 3.3 .env-Datei ausfüllen

Bearbeite `.env` und fülle folgende Werte aus:

**Datenbank** (Standardwerte für Docker-Setup):
```env
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/margin_hunter
DATABASE_URL_SYNC=postgresql://user:pass@postgres:5432/margin_hunter
```

**Redis**:
```env
REDIS_URL=redis://redis:6379/0
```

**Secrets** (generiert):
```env
SECRET_KEY=<dein-generierter-key>
DEBUG=False
```

**Telegram Bot** (optional, für lokalen Test kann auch leer bleiben):
```env
TELEGRAM_BOT_TOKEN=<dein-bot-token-vom-botfather>
TELEGRAM_CHAT_IDS=<deine-chat-id>
```

**Kleinanzeigen** (optional, Scraper kann auch mit Platzhalter laufen):
```env
KLEINANZEIGEN_EMAIL=<deine-email>
KLEINANZEIGEN_PASSWORD=<dein-passwort>
```

### 3.4 .env-Datei absichern

```bash
# Stelle sicher, dass .env nicht versioniert wird
chmod 600 .env
ls -la .env  # Sollte -rw------- zeigen
```

## Phase 4: Docker Compose starten

### 4.1 Images bauen

```bash
docker compose build
```

Dies kann einige Minuten dauern beim ersten Mal.

### 4.2 Services starten

```bash
docker compose up -d
```

### 4.3 Status prüfen

```bash
# Alle Container prüfen
docker compose ps

# Sollte zeigen:
# - margin-hunter-backend-1 (Up)
# - margin-hunter-frontend-1 (Up)
# - margin-hunter-scraper-1 (Up)
# - margin-hunter-telegram-bot-1 (Up)
# - margin-hunter-nginx-1 (Up)
# - margin-hunter-postgres-1 (Up)
# - margin-hunter-redis-1 (Up)
```

### 4.4 Logs anschauen

```bash
# Alle Logs
docker compose logs -f

# Einzelne Services
docker compose logs backend
docker compose logs postgres
docker compose logs nginx
```

## Phase 5: Verifizierung

### 5.1 Health Check

```bash
# Backend Health Check (intern)
curl http://localhost:8000/health

# Erwartete Antwort:
# {"status":"ok","database":"connected"}

# Via nginx (Port 80)
curl http://localhost/api/health
```

### 5.2 Frontend testen

```bash
# Via nginx im Browser
# Öffne: http://localhost
# Du solltest die Vite-React-App sehen, die den Backend-Health-Status anzeigt.
```

### 5.3 Datenbank-Verbindung prüfen

```bash
# PostgreSQL Container
docker compose exec postgres psql -U user -d margin_hunter -c "SELECT version();"
```

### 5.4 Redis-Verbindung prüfen

```bash
# Redis Container
docker compose exec redis redis-cli ping
# Sollte "PONG" zurückgeben
```

## Phase 6: Troubleshooting

### Problem: Container startet nicht

```bash
# 1. Logs prüfen
docker compose logs <service-name>

# 2. Container neu bauen
docker compose down
docker compose build --no-cache <service-name>
docker compose up -d

# 3. Volumes löschen (ACHTUNG: Löscht Daten!)
docker compose down -v
```

### Problem: Database Connection Error

```bash
# Prüfe ob PostgreSQL läuft
docker compose ps postgres

# Prüfe Logs
docker compose logs postgres

# Prüfe DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Container neu starten
docker compose restart postgres backend
```

### Problem: Port bereits belegt

```bash
# Prüfe welche Ports belegt sind
sudo netstat -tulpn | grep -E ':(80|8000|5432|6379)'

# Stoppe andere Services oder ändere Ports in docker-compose.yml
```

### Problem: Permission Denied

```bash
# Docker-Gruppe prüfen
groups $USER

# Falls docker nicht dabei:
sudo usermod -aG docker $USER
newgrp docker
```

### Problem: nginx gibt 502 Bad Gateway

```bash
# Prüfe ob Backend läuft
docker compose ps backend
docker compose logs backend

# Prüfe nginx Config
docker compose exec nginx nginx -t

# nginx neu laden
docker compose restart nginx
```

## Phase 7: Production-Härtung

### 7.1 SSL/HTTPS Setup (Optional)

Für SSL-Zertifikate mit Let's Encrypt:

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx -y

# Zertifikat generieren (ersetze yourdomain.com)
sudo certbot --nginx -d yourdomain.com

# Auto-Renewal testen
sudo certbot renew --dry-run
```

### 7.2 Backup-Strategie

**PostgreSQL Backup**:

```bash
# Einmaliges Backup
docker compose exec postgres pg_dump -U user margin_hunter > backup_$(date +%Y%m%d).sql

# Automatisches Backup (Cron)
# Füge zu crontab hinzu: 0 2 * * * cd /home/user/margin-hunter && docker compose exec -T postgres pg_dump -U user margin_hunter > backups/backup_$(date +\%Y\%m\%d).sql
```

### 7.3 Monitoring Setup

**Log-Rotation**:

```bash
# Docker Logs begrenzen (in docker-compose.yml):
# logging:
#   driver: "json-file"
#   options:
#     max-size: "10m"
#     max-file: "3"
```

**Resource Monitoring**:

```bash
# Container-Statistiken
docker stats

# Disk Usage
docker system df
```

## Phase 8: Wartung

### 8.1 Updates durchführen

```bash
# Code aktualisieren
cd /home/$USER/margin-hunter
git pull origin main

# Services neu bauen und starten
docker compose down
docker compose build
docker compose up -d
```

### 8.2 Logs rotieren

```bash
# Logs anschauen (letzte 100 Zeilen)
docker compose logs --tail=100

# Logs eines Services löschen (Container neu starten)
docker compose restart <service-name>
```

### 8.3 Datenbank-Migrationen

```bash
# Später mit Alembic:
docker compose exec backend alembic upgrade head
```

## Schnellreferenz

### Wichtige Befehle

```bash
# Services starten
docker compose up -d

# Services stoppen
docker compose down

# Logs anschauen
docker compose logs -f

# Einzelnen Service neu starten
docker compose restart <service-name>

# In Container einloggen
docker compose exec <service-name> /bin/bash

# Health Check
curl http://localhost:8000/health
```

### Ports

- **Port 80**: nginx (HTTP, nach außen)
- **Port 443**: nginx (HTTPS, optional)
- **Port 8000**: Backend (nur intern)
- **Port 5432**: PostgreSQL (nur intern)
- **Port 6379**: Redis (nur intern)

### Wichtige Dateien

- `docker-compose.yml` - Service-Konfiguration
- `.env` - Environment-Variablen (NIEMALS committen!)
- `nginx/nginx.conf` - Reverse Proxy Config
- `backend/app/config.py` - Backend Settings

## Support & Hilfe

Bei Problemen:

1. Prüfe die Logs: `docker compose logs -f`
2. Prüfe Health Checks: `curl http://localhost:8000/health`
3. Prüfe Container-Status: `docker compose ps`
4. Siehe Troubleshooting-Sektion oben

## Nächste Schritte

Nach erfolgreichem Setup:

1. ✅ Alle Services laufen
2. ⏳ Scraper konfigurieren
3. ⏳ Telegram Bot testen
4. ⏳ Frontend anpassen
5. ⏳ Monitoring einrichten
6. ⏳ Backups automatisieren

---

**Viel Erfolg! 🚀**

