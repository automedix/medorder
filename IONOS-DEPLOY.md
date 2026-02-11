# Deployment bei IONOS

> ⚠️ **Wichtig:** Du brauchst einen **IONOS Cloud Server** oder **VPS** – das IONOS Webhosting (für Websites) funktioniert NICHT, da wir Node.js und PostgreSQL benötigen.

## Empfohlene IONOS Produkte

| Produkt | Preis/Monat | Empfohlung |
|---------|-------------|------------|
| **Cloud Server S** | ~5 € | Minimum |
| **Cloud Server M** | ~10 € | ✅ Empfohlen |
| **VPS Linux L** | ~10 € | Alternative |

**Nicht geeignet:**
- ❌ IONOS Webhosting (WordPress/Homepage)
- ❌ IONOS MyWebsite

---

## Schritt 1: Server bei IONOS einrichten

### 1.1 Cloud Server bestellen

1. [IONOS Cloud](https://cloud.ionos.de/) öffnen
2. **"Compute Engine"** → **"Server"** wählen
3. Konfiguration:
   - **Betriebssystem:** Ubuntu 22.04 LTS
   - **Leistung:** 2 vCPU, 4 GB RAM, 40 GB SSD (oder mehr)
   - **Standort:** Deutschland (Berlin oder Frankfurt)
4. Bestellen & warten bis der Server bereit ist

### 1.2 SSH-Zugang einrichten

Im IONOS Cloud Panel:
1. Zu deinem Server navigieren
2. **"SSH Keys"** oder **"Remote Console"** öffnen
3. SSH-Key hinzufügen ODER Passwort für root setzen

---

## Schritt 2: Server vorbereiten

Mit Terminal/PowerShell verbinden:

```bash
# Mit Server verbinden (IP von IONOS Cloud Panel)
ssh root@DEINE-SERVER-IP

# System updaten
apt update && apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt install -y docker-compose-plugin

# Docker ohne sudo nutzen (optional)
usermod -aG docker $USER
newgrp docker

# Testen
docker --version
docker compose version
```

---

## Schritt 3: Projekt hochladen

### Option A: Mit SCP (Dateien kopieren)

Auf deinem lokalen Rechner:

```bash
# Projekt als ZIP packen
cd /pfad/zu/medorder
zip -r medorder.zip . -x "node_modules/*" ".next/*"

# Auf Server kopieren
scp medorder.zip root@DEINE-SERVER-IP:/opt/

# Auf Server entpacken
ssh root@DEINE-SERVER-IP "cd /opt && unzip medorder.zip -d medorder && rm medorder.zip"
```

### Option B: Mit Git (empfohlen)

Falls du ein Git-Repository hast:

```bash
# Auf Server
apt install -y git
cd /opt
git clone DEIN-REPO-URL medorder
```

---

## Schritt 4: Konfiguration anpassen

```bash
# Auf dem Server
cd /opt/medorder

# .env Datei erstellen
cat > .env << 'EOF'
# Datenbank (wird automatisch von docker-compose erstellt)
DATABASE_URL=postgresql://postgres:postgres@db:5432/medorder?schema=public

# NextAuth (ÄNDERN! Siehe Hinweis unten)
NEXTAUTH_URL=http://DEINE-SERVER-IP:3000
NEXTAUTH_SECRET=ein-sehr-langes-zufälliges-passwort-mindestens-32-zeichen-lang

# E-Mail (IONOS Mail)
SMTP_HOST=smtp.ionos.de
SMTP_PORT=587
SMTP_USER=praxis@deine-domain.de
SMTP_PASSWORD=dein-ionos-email-passwort
SMTP_FROM=praxis@deine-domain.de

# Empfänger der Bestellungen
ADMIN_EMAIL=praxis@hausaerzte-im-grillepark.online
EOF
```

### 🔐 WICHTIG: NextAuth Secret generieren

```bash
# Sicheren Schlüssel generieren
openssl rand -base64 32

# Das Ergebnis in .env eintragen bei NEXTAUTH_SECRET
```

---

## Schritt 5: Starten

```bash
cd /opt/medorder

# Container starten
docker compose up -d

# Warten bis DB bereit
sleep 15

# Datenbank migrieren
docker compose exec app npx prisma migrate deploy

# Seed-Daten einspielen
docker compose exec app npm run db:seed

# Status prüfen
docker compose ps
docker compose logs -f
```

**Fertig!** Die App läuft jetzt auf:
- `http://DEINE-SERVER-IP:3000`

---

## Schritt 6: Domain & HTTPS (optional aber empfohlen)

### 6.1 Domain bei IONOS einrichten

1. In IONOS Control Panel → Domains
2. DNS-Eintrag erstellen:
   - **Typ:** A-Record
   - **Hostname:** bestellung (oder medorder)
   - **Wert:** Deine Server-IP
3. Warten (kann bis zu 24h dauern)

### 6.2 HTTPS mit Let's Encrypt

```bash
# Nginx als Reverse Proxy installieren
apt install -y nginx certbot python3-certbot-nginx

# Nginx-Konfiguration
cat > /etc/nginx/sites-available/medorder << 'EOF'
server {
    listen 80;
    server_name bestellung.deine-domain.de;

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
EOF

# Aktivieren
ln -s /etc/nginx/sites-available/medorder /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL-Zertifikat erstellen
certbot --nginx -d bestellung.deine-domain.de

# Firewall anpassen
ufw allow 'Nginx Full'
ufw delete allow 'Nginx HTTP'  # Nur HTTPS erlauben
```

### 6.3 .env aktualisieren

```bash
# .env editieren
nano /opt/medorder/.env

# NEXTAUTH_URL ändern auf:
NEXTAUTH_URL=https://bestellung.deine-domain.de

# Container neustarten
cd /opt/medorder
docker compose down
docker compose up -d
```

---

## Schritt 7: IONOS Firewall freigeben

Im IONOS Cloud Panel:

1. **"Firewall"** → **"Bearbeiten"**
2. Folgende Ports erlauben:
   - **TCP 22** (SSH) – für dich
   - **TCP 80** (HTTP) – für Let's Encrypt
   - **TCP 443** (HTTPS) – für die App
   - **TCP 3000** (nur wenn ohne Nginx/HTTPS)

---

## Backup einrichten (wichtig!)

### Automatisches tägliches Backup

```bash
# Backup-Skript erstellen
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups
mkdir -p $BACKUP_DIR

# Datenbank backup
docker exec medorder-db-1 pg_dump -U postgres medorder | gzip > $BACKUP_DIR/medorder_$DATE.sql.gz

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "medorder_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup.sh

# Cronjob einrichten (täglich um 3 Uhr)
echo "0 3 * * * /opt/backup.sh" | crontab -
```

---

## Fehlerbehebung bei IONOS

### Verbindung wird abgelehnt
```bash
# IONOS Firewall prüfen!
# Im IONOS Cloud Panel → Firewall → Port 3000 freigeben
```

### E-Mails kommen nicht an (IONOS Mail)

IONOS hat strenge Spam-Filter:

```bash
# Test im Container
docker compose exec app node -e "
const nodemailer = require('nodemailer');
const t = nodemailer.createTransporter({
  host: 'smtp.ionos.de',
  port: 587,
  auth: { user: 'deine@email.de', pass: 'deinpasswort' }
});
t.sendMail({
  from: 'deine@email.de',
  to: 'praxis@hausaerzte-im-grillepark.online',
  subject: 'Test',
  text: 'Test'
}).then(() => console.log('OK')).catch(console.error);
"
```

**Hinweis:** IONOS erfordert oft eine aktive Postfach-Nutzung bevor SMTP funktioniert.

### Speicherplatz voll
```bash
# Prüfen
df -h

# Docker aufräumen
docker system prune -a
```

---

## Kostenübersicht IONOS

| Komponente | Kosten/Monat |
|------------|-------------|
| Cloud Server M | ~10 € |
| Domain (optional) | ~1-15 € |
| SSL (Let's Encrypt) | 0 € |
| E-Mail (IONOS Mail) | ~1-5 € |
| **Gesamt** | **~11-30 €/Monat** |

---

## Nächste Schritte

1. ✅ IONOS Cloud Server bestellen
2. ✅ SSH verbinden & Docker installieren
3. ✅ Projekt hochladen
4. ✅ `./deploy.sh` ausführen
5. ✅ Domain einrichten (optional)
6. ✅ HTTPS aktivieren (optional)

Brauchst du Hilfe bei einem bestimmten Schritt?
