# Margin Hunter - Deployment Checkliste

Phase-für-Phase Deployment-Guide für Production-Setup auf Ubuntu VM.

## Phase 0: Vorbereitung

### System-Checks

- [ ] Ubuntu Server 20.04+ installiert
- [ ] SSH-Zugriff konfiguriert
- [ ] Root/Sudo-Berechtigung vorhanden
- [ ] Mindestens 2 GB RAM verfügbar
- [ ] 10 GB freier Festplattenspeicher
- [ ] Internet-Verbindung vorhanden

### Software-Checks

- [ ] Git installiert (`git --version`)
- [ ] Docker installiert (`docker --version`)
- [ ] Docker Compose installiert (`docker compose version`)

**Zeitaufwand**: 5 Minuten

---

## Phase 1: System-Vorbereitung

### 1.1 System aktualisieren

```bash
sudo apt update && sudo apt upgrade -y
```

- [ ] System aktualisiert
- [ ] Keine Fehler in der Ausgabe

### 1.2 Docker installieren

Siehe `README_SETUP.md` Abschnitt 1.2 für detaillierte Anleitung.

```bash
# Repository hinzufügen
sudo apt install ca-certificates curl gnupg lsb-release -y
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
```

- [ ] Docker installiert
- [ ] `docker --version` zeigt Version
- [ ] `docker compose version` zeigt Version

### 1.3 Docker-Gruppe konfigurieren

```bash
sudo usermod -aG docker $USER
newgrp docker
```

- [ ] Benutzer in docker-Gruppe
- [ ] `docker ps` funktioniert ohne sudo

### 1.4 Firewall konfigurieren

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (optional)
sudo ufw enable
```

- [ ] Port 22 (SSH) offen
- [ ] Port 80 (HTTP) offen
- [ ] Port 443 (HTTPS) offen (optional)
- [ ] Firewall aktiviert
- [ ] `sudo ufw status` zeigt korrekte Regeln

**Zeitaufwand**: 10-15 Minuten

---

## Phase 2: Repository Setup

### 2.1 Repository klonen

```bash
cd /home/$USER
git clone https://github.com/TimoDeg/margin-hunter.git
cd margin-hunter
```

- [ ] Repository geklont
- [ ] Im Projektverzeichnis

### 2.2 Projektstruktur prüfen

```bash
ls -la
```

- [ ] `docker-compose.yml` vorhanden
- [ ] `backend/` Verzeichnis vorhanden
- [ ] `frontend/` Verzeichnis vorhanden
- [ ] `scraper/` Verzeichnis vorhanden
- [ ] `telegram-bot/` Verzeichnis vorhanden
- [ ] `nginx/` Verzeichnis vorhanden

**Zeitaufwand**: 2 Minuten

---

## Phase 3: Environment-Konfiguration

### 3.1 .env-Datei erstellen

```bash
cp env.example .env
```

- [ ] `.env` Datei erstellt

### 3.2 Secrets generieren

```bash
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

- [ ] Secret Key generiert
- [ ] Secret Key in `.env` eingetragen

### 3.3 .env-Datei konfigurieren

Bearbeite `.env` mit `nano .env`:

**Datenbank**:
- [ ] `DATABASE_URL` korrekt (async)
- [ ] `DATABASE_URL_SYNC` korrekt (sync, ohne +asyncpg!)
- [ ] Credentials angepasst (falls gewünscht)

**Redis**:
- [ ] `REDIS_URL` korrekt

**Security**:
- [ ] `SECRET_KEY` gesetzt
- [ ] `DEBUG=False` für Production

**Telegram** (optional):
- [ ] `TELEGRAM_BOT_TOKEN` gesetzt
- [ ] `TELEGRAM_CHAT_IDS` gesetzt

**Kleinanzeigen** (optional):
- [ ] `KLEINANZEIGEN_EMAIL` gesetzt
- [ ] `KLEINANZEIGEN_PASSWORD` gesetzt

### 3.4 .env-Datei absichern

```bash
chmod 600 .env
```

- [ ] `.env` hat nur Benutzer-Lese-/Schreibrechte (600)
- [ ] `.env` ist in `.gitignore` (sollte bereits sein)

**Zeitaufwand**: 5 Minuten

---

## Phase 4: Docker Build & Start

### 4.1 Docker Images bauen

```bash
docker compose build
```

- [ ] Alle Images erfolgreich gebaut
- [ ] Keine Build-Fehler

### 4.2 Services starten

```bash
docker compose up -d
```

- [ ] Alle Services gestartet
- [ ] `docker compose ps` zeigt alle Container als "Up"

### 4.3 Container-Status prüfen

```bash
docker compose ps
```

**Erwartete Container**:
- [ ] `margin-hunter-backend-1` - Status: Up
- [ ] `margin-hunter-frontend-1` - Status: Up
- [ ] `margin-hunter-scraper-1` - Status: Up
- [ ] `margin-hunter-telegram-bot-1` - Status: Up
- [ ] `margin-hunter-nginx-1` - Status: Up
- [ ] `margin-hunter-postgres-1` - Status: Up
- [ ] `margin-hunter-redis-1` - Status: Up

**Zeitaufwand**: 5-10 Minuten (beim ersten Build)

---

## Phase 5: Verifizierung

### 5.1 Logs prüfen

```bash
docker compose logs -f
```

- [ ] Keine kritischen Fehler in Logs
- [ ] Backend startet erfolgreich
- [ ] PostgreSQL startet erfolgreich
- [ ] Redis startet erfolgreich
- [ ] nginx startet erfolgreich

### 5.2 Health Checks

```bash
# Backend Health Check (intern)
curl http://localhost:8000/health
```

- [ ] Health Check erfolgreich
- [ ] Antwort: `{"status":"ok","database":"connected"}`

```bash
# Backend via nginx
curl http://localhost/api/health
```

- [ ] Health Check via nginx erfolgreich

### 5.3 Datenbank-Verbindung

```bash
docker compose exec postgres psql -U user -d margin_hunter -c "SELECT version();"
```

- [ ] PostgreSQL-Verbindung funktioniert
- [ ] Datenbank `margin_hunter` existiert

### 5.4 Redis-Verbindung

```bash
docker compose exec redis redis-cli ping
```

- [ ] Redis antwortet: `PONG`

### 5.5 Frontend-Zugriff

```bash
curl http://localhost
```

- [ ] Frontend erreichbar
- [ ] HTML wird zurückgegeben

**Zeitaufwand**: 5 Minuten

---

## Phase 6: Production-Härtung

### 6.1 Log-Rotation konfigurieren

Prüfe `docker-compose.yml` für Log-Konfiguration:
- [ ] `max-size` gesetzt (z.B. 10m)
- [ ] `max-file` gesetzt (z.B. 3)

### 6.2 Backup-Strategie

**PostgreSQL Backup**:
```bash
mkdir -p backups
docker compose exec postgres pg_dump -U user margin_hunter > backups/backup_$(date +%Y%m%d).sql
```

- [ ] Backup-Verzeichnis erstellt
- [ ] Erstes Backup erfolgreich
- [ ] Cron-Job eingerichtet (optional)

### 6.3 Monitoring Setup

**Resource Monitoring**:
```bash
docker stats
```

- [ ] Container-Ressourcen überwacht
- [ ] Monitoring-Tools eingerichtet (optional)

### 6.4 SSL/HTTPS Setup (Optional)

Für Production mit Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

- [ ] Certbot installiert
- [ ] SSL-Zertifikat generiert
- [ ] Auto-Renewal konfiguriert

**Zeitaufwand**: 10-20 Minuten (optional)

---

## Phase 7: Finale Verifizierung

### 7.1 Externe Zugriffe testen

- [ ] Frontend erreichbar über `http://your-vm-ip`
- [ ] API erreichbar über `http://your-vm-ip/api/health`
- [ ] Swagger Docs erreichbar über `http://your-vm-ip/api/docs`

### 7.2 Funktionalitätstests

- [ ] Backend API antwortet korrekt
- [ ] Frontend lädt ohne Fehler
- [ ] Datenbank-Operationen funktionieren
- [ ] Redis-Cache funktioniert

### 7.3 Performance-Checks

```bash
docker stats
```

- [ ] Memory-Usage < 2 GB
- [ ] CPU-Usage normal
- [ ] Keine Memory Leaks

**Zeitaufwand**: 10 Minuten

---

## Rollback-Prozedur

Falls etwas schiefgeht:

### Sofort-Rollback

```bash
# Services stoppen
docker compose down

# Alte Images behalten, nur Container entfernen
docker compose down --remove-orphans

# Bei Bedarf: Volumes löschen (ACHTUNG: Löscht Daten!)
# docker compose down -v
```

### Datenbank-Rollback

```bash
# Backup wiederherstellen
docker compose exec -T postgres psql -U user margin_hunter < backups/backup_YYYYMMDD.sql
```

### Vollständiger Reset

```bash
# Alles stoppen und entfernen
docker compose down -v

# Images entfernen
docker rmi $(docker images margin-hunter* -q)

# Neu starten
docker compose build
docker compose up -d
```

---

## Monitoring-Empfehlungen

### Logs überwachen

```bash
# Alle Logs in Echtzeit
docker compose logs -f

# Einzelner Service
docker compose logs -f backend
```

### Health Checks automatisieren

```bash
# Cron-Job für Health Checks
# */5 * * * * curl -f http://localhost:8000/health || echo "Backend down!" | mail -s "Alert" admin@example.com
```

### Ressourcen-Überwachung

```bash
# Disk Usage
docker system df

# Container Stats
docker stats --no-stream
```

---

## Wartungs-Checkliste

### Wöchentlich

- [ ] Logs prüfen auf Fehler
- [ ] Disk Usage prüfen
- [ ] Backup-Status prüfen

### Monatlich

- [ ] System-Updates durchführen
- [ ] Docker Images aktualisieren
- [ ] Backup testen (Restore auf Test-System)

### Bei Updates

- [ ] Git Pull durchführen
- [ ] `.env` aktualisieren (falls nötig)
- [ ] Images neu bauen
- [ ] Services neu starten
- [ ] Health Checks durchführen

---

## Erfolgs-Kriterien

✅ **Deployment erfolgreich wenn:**

- [ ] Alle 7 Container laufen
- [ ] Health Check gibt `{"status":"ok","database":"connected"}` zurück
- [ ] Frontend ist über Port 80 erreichbar
- [ ] Backend API antwortet korrekt
- [ ] Datenbank-Verbindung funktioniert
- [ ] Redis-Verbindung funktioniert
- [ ] Keine kritischen Fehler in Logs
- [ ] Ressourcen-Verbrauch normal

---

## Gesamt-Zeitaufwand

| Phase | Zeit |
|-------|------|
| Phase 0: Vorbereitung | 5 Min |
| Phase 1: System-Vorbereitung | 15 Min |
| Phase 2: Repository Setup | 2 Min |
| Phase 3: Environment-Konfiguration | 5 Min |
| Phase 4: Docker Build & Start | 10 Min |
| Phase 5: Verifizierung | 5 Min |
| Phase 6: Production-Härtung | 20 Min (optional) |
| Phase 7: Finale Verifizierung | 10 Min |
| **TOTAL** | **~70 Minuten** |

---

## Support

Bei Problemen:

1. Prüfe Logs: `docker compose logs -f`
2. Prüfe Health Checks
3. Siehe Troubleshooting in `README_SETUP.md`
4. Prüfe Container-Status: `docker compose ps`

**Viel Erfolg beim Deployment! 🚀**

