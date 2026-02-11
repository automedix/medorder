# Quick Deploy Script für MedOrder

set -e

echo "🚀 MedOrder Deployment Script"
echo "=============================="

# Farben
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Prüfe Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker ist nicht installiert${NC}"
    echo "Installiere Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose ist nicht installiert${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker gefunden${NC}"

# Prüfe .env
if [ ! -f .env ]; then
    echo "⚠️  .env Datei nicht gefunden"
    echo "Kopiere .env.example nach .env..."
    cp .env.example .env
    echo -e "${RED}⚠️  Bitte .env anpassen und Script erneut starten!${NC}"
    exit 1
fi

echo "🐳 Starte Container..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo "⏳ Warte auf Datenbank..."
sleep 10

echo "🗄️  Führe Migrationen aus..."
docker-compose exec -T app npx prisma migrate deploy || {
    echo -e "${RED}⚠️  Migration fehlgeschlagen, versuche erneut...${NC}"
    sleep 5
    docker-compose exec -T app npx prisma migrate deploy
}

echo "🌱 Füge Beispieldaten ein..."
docker-compose exec -T app npm run db:seed || true

echo ""
echo -e "${GREEN}==============================${NC}"
echo -e "${GREEN}✅ Deployment erfolgreich!${NC}"
echo -e "${GREEN}==============================${NC}"
echo ""
echo "🌐 App läuft auf: http://localhost:3000"
echo ""
echo "Login-Daten:"
echo "  Admin: admin@praxis.de / admin123"
echo "  Pflegeheim: demo@pflegeheim.de / demo123"
echo ""
echo "Nützliche Befehle:"
echo "  docker-compose logs -f    # Logs ansehen"
echo "  docker-compose ps         # Status prüfen"
echo "  docker-compose down       # Stoppen"
echo ""
