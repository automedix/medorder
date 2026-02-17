# 🚀 MedOrder Deployment Guide

## Schnell-Deploy (manuell)

```bash
# Auf dem Server:
cd /var/www/medorder

# 1. Code aktualisieren
git pull origin main

# 2. Dependencies
npm ci

# 3. Prisma aktualisieren
npx prisma generate
npx prisma migrate deploy

# 4. Build
npm run build

# 5. Restart
pm2 restart medorder
```

## Oder einfach:

```bash
chmod +x deploy.sh
./deploy.sh
```

## GitHub Actions Auto-Deploy

1. **Secrets in Repository eintragen:**
   - `NEXTAUTH_SECRET` - JWT Secret
   - `DATABASE_URL` - PostgreSQL URL (oder SQLite Pfad)
   - `SSH_HOST` - Server IP/Domain
   - `SSH_USER` - Server User
   - `SSH_PRIVATE_KEY` - SSH Key für Deployment

2. **Push auf main** → Auto-Deploy startet

## Manuelle Änderungen deployen

### Nur Masterpasswort geändert?
Nur die Datenbank braucht das Update - kein Restart nötig (außer bei .env Änderungen).

### Code-Änderungen?
```bash
npm run build
pm2 restart medorder
```

### Datenbank-Schema geändert?
```bash
npx prisma migrate deploy
npm run build
pm2 restart medorder
```

## Troubleshooting

**Fehler: "database is locked"**
→ PM2 stoppen, dann Migration, dann starten:
```bash
pm2 stop medorder
npx prisma migrate deploy
pm2 start medorder
```

**Fehler: "Module not found"**
→ Dependencies neu installieren:
```bash
rm -rf node_modules
npm ci
```

**Build-Fehler**
→ TypeScript-Prüfung überspringen (nur im Notfall):
```bash
NEXT_TELEMETRY_DISABLED=1 npm run build
```