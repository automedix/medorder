#!/bin/bash
set -e

# Erstinstallation MedOrder auf neuem Server
# FÜR ERSTINSTALLATION - Nicht für Updates!

echo "🚀 MedOrder Erstinstallation"
echo "============================="
echo ""
echo "⚠️  Dieses Skript richtet MedOrder NEU ein!"
echo "   Nur für frische Server verwenden."
echo ""
read -p "Fortfahren? (j/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Jj]$ ]]; then
    echo "Abgebrochen."
    exit 1
fi

# Variablen
APP_DIR="/opt/medorder"
GITHUB_REPO="https://github.com/125apollo/medorder.git"

# System updaten
echo "📦 System wird aktualisiert..."
apt update && apt upgrade -y

# Docker installieren (falls nicht vorhanden)
if ! command -v docker &> /dev/null; then
    echo "🐳 Installiere Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Docker Compose Plugin
echo "🔧 Prüfe Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    apt install -y docker-compose-plugin
fi

# App-Verzeichnis erstellen
echo "📁 Erstelle App-Verzeichnis..."
mkdir -p $APP_DIR
cd $APP_DIR

# Repository klonen
echo "⬇️  Klone Repository..."
git clone $GITHUB_REPO .

# .env erstellen
echo ""
echo "🔐 Umgebungsvariablen konfigurieren"
echo "===================================="
read -p "Domain (z.B. bestellung.deine-domain.de oder leer für IP): " DOMAIN
read -p "Admin E-Mail für Bestellungen: " ADMIN_EMAIL
read -p "SMTP Host (z.B. smtp.ionos.de): " SMTP_HOST
read -p "SMTP Port (587): " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}
read -p "SMTP User: " SMTP_USER
read -sp "SMTP Passwort: " SMTP_PASSWORD
echo

# NextAuth Secret generieren
AUTH_SECRET=$(openssl rand -base64 32)

# .env schreiben
cat > .env << EOF
# Datenbank
DATABASE_URL=postgresql://postgres:postgres@db:5432/medorder?schema=public

# NextAuth
NEXTAUTH_URL=http://${DOMAIN:-localhost:3000}
NEXTAUTH_SECRET=$AUTH_SECRET

# E-Mail
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=$SMTP_USER

# Admin E-Mail für Bestell-Benachrichtigungen
ADMIN_EMAIL=$ADMIN_EMAIL
EOF

echo "✅ .env erstellt"

# Docker Compose starten
echo "🐳 Starte Container..."
docker compose up -d

# Warten
echo "⏳ Warte auf Datenbank..."
sleep 20

# Migrationen
echo "🗄️  Datenbank-Migrationen..."
docker compose exec -T app npx prisma migrate deploy

# Seed-Daten
echo "🌱 Erstelle Demo-Daten..."
docker compose exec -T app npm run db:seed

# Nginx installieren (optional)
echo ""
read -p "Nginx als Reverse Proxy installieren? (j/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    echo "🌐 Installiere Nginx..."
    apt install -y nginx certbot python3-certbot-nginx
    
    # Nginx Config
    cat > /etc/nginx/sites-available/medorder << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/medorder /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    
    echo "✅ Nginx konfiguriert"
    echo "   HTTP: http://$DOMAIN"
    
    # SSL
    if [ -n "$DOMAIN" ]; then
        read -p "SSL-Zertifikat (HTTPS) einrichten? (j/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Jj]$ ]]; then
            certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL
            
            # .env aktualisieren auf HTTPS
            sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|" .env
            docker compose down && docker compose up -d
            
            echo "✅ HTTPS aktiviert: https://$DOMAIN"
        fi
    fi
fi

# Backup-Skript
echo ""
read -p "Automatische Backups einrichten? (j/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    cat > /opt/backup-medorder.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups
mkdir -p $BACKUP_DIR

# Datenbank backup
docker exec medorder-db-1 pg_dump -U postgres medorder | gzip > $BACKUP_DIR/medorder_$DATE.sql.gz

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "medorder_*.sql.gz" -mtime +30 -delete

echo "Backup erstellt: $BACKUP_DIR/medorder_$DATE.sql.gz"
EOF
    chmod +x /opt/backup-medorder.sh
    
    # Cronjob
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/backup-medorder.sh >> /var/log/medorder-backup.log 2>&1") | crontab -
    
    echo "✅ Tägliches Backup um 3 Uhr eingerichtet"
fi

# Fertig
echo ""
echo "🎉 INSTALLATION ABGESCHLOSSEN!"
echo "==============================="
echo ""
docker compose ps
echo ""
echo "🌐 App erreichbar unter:"
if [ -n "$DOMAIN" ]; then
    echo "   https://$DOMAIN (oder http:// falls kein SSL)"
else
    echo "   http://$(hostname -I | awk '{print $1}'):3000"
fi
echo ""
echo "🔑 Standard-Logins:"
echo "   Admin:    admin@praxis.de / admin123"
echo "   Pflegeheim: demo@pflegeheim.de / demo123"
echo ""
echo "📋 Nützliche Befehle:"
echo "   Logs:     docker compose logs -f"
echo "   Stop:     docker compose down"
echo "   Start:    docker compose up -d"
echo "   Backup:   /opt/backup-medorder.sh"
echo ""
