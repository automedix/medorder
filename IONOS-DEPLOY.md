# Deployment bei IONOS

> ⚠️ **Wichtig:** Du brauchst einen **IONOS Cloud Server** oder **VPS** – das IONOS Webhosting (für Websites) funktioniert NICHT, da wir Node.js und PostgreSQL benötigen.

## Empfohlene IONOS Produkte

| Produkt | Preis/Monat | Empfehlung |
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
git clone https://github.com/automedix/medorder.git medorder
```

---

## Schritt 4: Konfiguration anpassen

```bash
# Auf dem Server
cd /opt/medorder

# .env Datei erstellen (von .env.example kopieren und anpassen!)
cp .env.example .env
nano .env
```

### 🔐 WICHTIG: Secrets generieren

```bash
# Sicheren Schlüssel für NEXTAUTH_SECRET generieren
openssl rand -base64 32

# Sicheres Master-Passwort wählen
# NICHT den Beispiel-Wert nutzen!
```

---

## Schritt 5: Starten

```bash
cd /opt/medorder

# Container starten
docker compose up -d

# oder bei manueller Installation:
npm ci
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js
```

**Fertig!** Die App läuft jetzt auf deinem Server.

---

## Schritt 6: Domain & HTTPS

### 6.1 Domain einrichten

1. Domain bei IONOS registrieren oder externe Domain nutzen
2. DNS-A-Record auf deine Server-IP setzen
3. Warten (kann bis zu 24h dauern)

### 6.2 HTTPS mit Let's Encrypt

```bash
# Nginx als Reverse Proxy installieren
apt install -y nginx certbot python3-certbot-nginx

# Certbot ausführen
certbot --nginx -d deine-domain.de

# Firewall anpassen
ufw allow 'Nginx Full'
```

### 6.3 .env aktualisieren

```bash
# NEXTAUTH_URL auf HTTPS aktualisieren
NEXTAUTH_URL=https://deine-domain.de
```

---

## Backup einrichten

```bash
# Backup-Skript erstellen
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups
mkdir -p $BACKUP_DIR
docker exec medorder-db-1 pg_dump -U postgres medorder | gzip > $BACKUP_DIR/medorder_$DATE.sql.gz
find $BACKUP_DIR -name "medorder_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup.sh
echo "0 3 * * * /opt/backup.sh" | crontab -
```

---

## Kostenübersicht IONOS

| Komponente | Kosten/Monat |
|------------|-------------|
| Cloud Server M | ~10 € |
| Domain | ~1-15 € |
| SSL (Let's Encrypt) | 0 € |
| **Gesamt** | **~11-25 €/Monat** |
