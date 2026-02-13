#!/bin/bash
set -e

# MedOrder Server Deploy Script
# Kopiere dieses Skript auf deinen Server und führe es aus

echo "🚀 MedOrder Deployment gestartet"
echo "================================"

# Konfiguration
APP_DIR="/opt/medorder"
GITHUB_REPO="https://github.com/125apollo/medorder.git"

# Prüfen ob im richtigen Verzeichnis
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Verzeichnis $APP_DIR existiert nicht. Klone Repository..."
    mkdir -p /opt
    cd /opt
    git clone $GITHUB_REPO medorder
    cd medorder
else
    echo "📁 Wechsle zu $APP_DIR"
    cd $APP_DIR
fi

# Git Pull - Aktuellsten Code holen
echo "⬇️  Hole aktuellen Code von GitHub..."
git pull origin main

# Container stoppen
echo "🛑 Stoppe aktuelle Container..."
docker compose down

# Container neu bauen und starten
echo "🔨 Baue und starte Container..."
docker compose up --build -d

# Warten bis DB bereit
echo "⏳ Warte auf Datenbank..."
sleep 15

# Migrationen ausführen
echo "🗄️  Führe Datenbank-Migrationen aus..."
docker compose exec -T app npx prisma migrate deploy

# Prüfen ob Seed-Daten nötig (optional)
# docker compose exec -T app npm run db:seed

# Status anzeigen
echo ""
echo "✅ Deployment abgeschlossen!"
echo "================================"
echo ""
docker compose ps
echo ""
echo "📊 Logs anzeigen: docker compose logs -f"
echo "🌐 App sollte erreichbar sein unter:"
echo "   - HTTP:  http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Falls Domain eingerichtet:"
echo "   - https://deine-domain.de"
