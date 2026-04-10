# 🚀 MedOrder Deployment Guide

## Vor dem Deployment

1. **.env.example kopieren und anpassen:**
   ```bash
   cp .env.example .env
   # Dann alle Werte in .env anpassen!
   ```

2. **Wichtige Änderungen in .env:**
   - `NEXTAUTH_SECRET`: Generiere mit `openssl rand -base64 32`
   - `MASTER_PASSWORD`: Setze ein sicheres Passwort
   - `NEXTAUTH_URL`: Deine Domain
   - `ADMIN_EMAIL`: Deine Admin-E-Mail

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
   - `DATABASE_URL` - PostgreSQL URL
   - `SSH_HOST` - Server IP/Domain
   - `SSH_USER` - Server User
   - `SSH_PRIVATE_KEY` - SSH Key

2. **Push auf main** → Auto-Deploy startet

## Troubleshooting

**Fehler: "database is locked"**
```bash
pm2 stop medorder
npx prisma migrate deploy
pm2 start medorder
```

**Fehler: "Module not found"**
```bash
rm -rf node_modules
npm ci
```

**Build-Fehler**
```bash
NEXT_TELEMETRY_DISABLED=1 npm run build
```
