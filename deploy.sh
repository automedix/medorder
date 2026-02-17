#!/bin/bash

# MedOrder Deployment Script
# Führt alle nötigen Schritte für ein Deployment aus

set -e

echo "🚀 Starte MedOrder Deployment..."

# 1. Git Pull
echo "📥 Pulling latest changes..."
git pull origin main

# 2. Dependencies installieren
echo "📦 Installing dependencies..."
npm ci

# 3. Prisma Client generieren
echo "🔄 Generating Prisma Client..."
npx prisma generate

# 4. Database Migration (falls nötig)
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# 5. Build
echo "🔨 Building application..."
npm run build

# 6. PM2 Restart (falls verwendet)
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting PM2 process..."
    pm2 restart medorder || pm2 start npm --name "medorder" -- start
    pm2 save
else
    echo "⚠️ PM2 not found. Starting with npm start..."
    npm start
fi

echo "✅ Deployment completed successfully!"