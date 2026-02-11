# Deployment-Anleitung MedOrder

## Schnellstart (mit Docker)

### Voraussetzungen
- Server mit Docker & Docker Compose installiert
- Domain (optional, für HTTPS)
- Mindestens 2GB RAM, 10GB Speicher

### Option 1: Schnell-Deployment (lokal/Intern)

```bash
# 1. Projekt auf Server kopieren
scp -r medorder user@server:/opt/
ssh user@server
cd /opt/medorder

# 2. Starten
docker-compose up -d

# 3. Datenbank migrieren
docker-compose exec app npx prisma migrate deploy

# 4. Seed-Daten einspielen
docker-compose exec app npm run db:seed
```

**Fertig!** Die App läuft auf `http://server-ip:3000`

---

### Option 2: Produktiv-Deployment (mit Domain & HTTPS)

#### 1. Server vorbereiten

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Docker-User hinzufügen
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Projekt deployen

```bash
# Verzeichnis erstellen
mkdir -p /opt/medorder
cd /opt/medorder

# Projektdateien kopieren (oder git clone)
# ...

# Umgebungsvariablen anpassen
cp .env.example .env
nano .env
```

**.env anpassen:**
```bash
NEXTAUTH_URL=https://medorder.deine-domain.de
NEXTAUTH_SECRET=ein-sehr-langes-zufälliges-passwort-mindestens-32-zeichen

# E-Mail (für Bestellbenachrichtigungen)
SMTP_HOST=smtp.strato.de
SMTP_PORT=587
SMTP_USER=praxis@deine-domain.de
SMTP_PASSWORD=dein-email-passwort
SMTP_FROM=praxis@deine-domain.de

ADMIN_EMAIL=praxis@hausaerzte-im-grillepark.online
```

#### 3. Starten

```bash
docker-compose up -d

# Warten bis DB bereit ist (ca. 10 Sekunden)
sleep 10

# Migrationen ausführen
docker-compose exec app npx prisma migrate deploy

# Seed-Daten
docker-compose exec app npm run db:seed
```

#### 4. Nginx als Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/medorder
```

**Inhalt:**
```nginx
server {
    listen 80;
    server_name medorder.deine-domain.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/medorder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL-Zertifikat
certbot --nginx -d medorder.deine-domain.de
```

---

## Wichtige Befehle

### Logs ansehen
```bash
# Alle Services
docker-compose logs -f

# Nur App
docker-compose logs -f app

# Nur Datenbank
docker-compose logs -f db
```

### Updates einspielen
```bash
cd /opt/medorder
git pull  # oder neue Dateien kopieren

docker-compose down
docker-compose up -d --build

docker-compose exec app npx prisma migrate deploy
```

### Backup erstellen
```bash
# Datenbank-Backup
docker-compose exec db pg_dump -U postgres medorder > backup_$(date +%Y%m%d).sql

# Oder mit Kompression
docker-compose exec db pg_dump -U postgres medorder | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Backup wiederherstellen
```bash
# Datenbank stoppen
docker-compose stop db

# Backup einspielen
gunzip < backup_20250207.sql.gz | docker-compose exec -T db psql -U postgres medorder

# Oder ohne Kompression
docker-compose exec -T db psql -U postgres medorder < backup_20250207.sql

docker-compose start db
```

### Admin-Passwort zurücksetzen
```bash
docker-compose exec app npx tsx scripts/reset-admin-password.ts
```

---

## Fehlerbehebung

### Port 3000 ist belegt
```bash
# Anderen Port verwenden (docker-compose.yml editieren)
ports:
  - "3001:3000"
```

### Datenbank-Verbindung schlägt fehl
```bash
# Logs prüfen
docker-compose logs db

# Datenbank manuell testen
docker-compose exec db psql -U postgres -d medorder -c "\dt"
```

### E-Mails kommen nicht an
```bash
# SMTP-Test im Container
docker-compose exec app node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
});
transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: process.env.ADMIN_EMAIL,
  subject: 'Test',
  text: 'Testnachricht'
}).then(() => console.log('OK')).catch(console.error);
"
```

---

## Sicherheitscheckliste

- [ ] `NEXTAUTH_SECRET` ist ein langer zufälliger String (min. 32 Zeichen)
- [ ] Datenbank-Passwort wurde geändert (nicht `postgres`)
- [ ] E-Mail-Zugangsdaten sind korrekt
- [ ] Firewall regelt Zugriff (nur Port 80/443/22)
- [ ] Automatische Backups eingerichtet
- [ ] HTTPS aktiv (Let's Encrypt)
- [ ] Demo-Zugangsdaten geändert

---

## Hosting-Empfehlungen

### Deutschland (DSGVO-konform)
- **Hetzner Cloud** (ab 4,51€/Monat)
- **Contabo** (ab 5,99€/Monat)
- **Strato** (ab 5€/Monat)

### Systemanforderungen
- 2 GB RAM minimum
- 2 vCPU
- 20 GB SSD
- Ubuntu 22.04 LTS

---

## Support

Bei Problemen:
1. Logs prüfen: `docker-compose logs -f`
2. Container-Status: `docker-compose ps`
3. Datenbank-Verbindung testen
4. Ports prüfen: `netstat -tlnp`
