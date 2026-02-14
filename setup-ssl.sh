#!/bin/bash
# SSL Setup Script für bestellungen.hausaerzte-im-grillepark.online
# Ausführen auf dem Server nach dem Deploy

set -e

echo "🔧 SSL Setup für bestellungen.hausaerzte-im-grillepark.online"
echo "============================================================"

# Prüfe ob als root ausgeführt
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Bitte als root oder mit sudo ausführen"
    exit 1
fi

DOMAIN="bestellungen.hausaerzte-im-grillepark.online"

echo "📦 Installiere nginx und certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

echo "📝 Erstelle Nginx-Konfiguration..."
cat > /etc/nginx/sites-available/bestellungen << 'EOF'
server {
    listen 80;
    server_name bestellungen.hausaerzte-im-grillepark.online;

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

echo "🔗 Aktiviere Nginx-Konfiguration..."
rm -f /etc/nginx/sites-enabled/bestellungen
ln -s /etc/nginx/sites-available/bestellungen /etc/nginx/sites-enabled/

# Entferne default config falls vorhanden
rm -f /etc/nginx/sites-enabled/default

echo "✅ Teste Nginx-Konfiguration..."
nginx -t

echo "🚀 Starte Nginx..."
systemctl reload nginx
systemctl enable nginx

echo "🔒 Erstelle Let's Encrypt Zertifikat..."
certbot --nginx -d bestellungen.hausaerzte-im-grillepark.online --non-interactive --agree-tos --email admin@hausaerzte-im-grillepark.online

echo "🔥 Firewall anpassen (falls ufw aktiv)..."
ufw allow 'Nginx Full' 2>/dev/null || true
ufw delete allow 'Nginx HTTP' 2>/dev/null || true

echo ""
echo "============================================================"
echo "✅ SSL Setup abgeschlossen!"
echo "============================================================"
echo ""
echo "🌐 Deine App läuft jetzt auf:"
echo "   https://bestellungen.hausaerzte-im-grillepark.online"
echo ""
echo "⚠️  Wichtig: Stelle sicher, dass Port 443 in der IONOS"
echo "    Firewall freigegeben ist!"
echo ""
echo "🔧 Nützliche Befehle:"
echo "   nginx -t              # Konfig testen"
echo "   certbot renew --dry-run  # Zertifikat-Renewal testen"
echo "   systemctl status nginx   # Nginx Status"
echo ""
