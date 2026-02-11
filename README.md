# MedOrder - Verbandmaterial-Bestellsystem

Digitale Bestellplattform für Pflegedienste und Pflegeheime bei Arztpraxen.

## Features

- 🔐 Login für Pflegeheime und Praxis-Admin
- 👥 Patientenverwaltung
- 📦 Produktkatalog mit Kategorien
- 💰 Preisliste mit PZN und Anbietern
- 🛒 Einfacher Bestellprozess (3 Schritte)
- 📧 Automatische E-Mail-Benachrichtigungen
- ✅ Bestellstatus-Verwaltung für die Praxis
- 💡 Automatische Preisvorschläge (3 günstigste Anbieter)

## Tech Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth.js
- Nodemailer

## Installation

### 1. Voraussetzungen

- Node.js 18+
- PostgreSQL Datenbank

### 2. Setup

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env anpassen mit deinen Datenbank- und E-Mail-Daten

# Datenbank-Migrationen ausführen
npx prisma migrate dev --name init

# Seed-Daten einspielen
npm run db:seed
```

### 3. Starten

```bash
# Entwicklungsmodus
npm run dev

# Produktion
npm run build
npm start
```

## Standard-Login

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@praxis.de | admin123 |
| Pflegeheim | demo@pflegeheim.de | demo123 |

## Umgebungsvariablen

```env
DATABASE_URL="postgresql://user:password@localhost:5432/medorder?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# E-Mail (optional für lokale Tests)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@medorder.de"

# Empfänger der Bestellungen
ADMIN_EMAIL="praxis@example.com"
```

## Bestellablauf

1. Pflegeheim loggt sich ein
2. Wählt Patient aus (oder legt neuen an)
3. Wählt Produkte aus dem Sortiment
4. Gibt optional einen Hinweis ein
5. Bestellung wird per E-Mail an die Praxis gesendet

## Admin-Funktionen

- Sortiment (Produkte/Kategorien) pflegen
- **Preisliste verwalten** (PZN, Anbieter, Preise)
- Bestellungen als "erledigt" markieren mit automatischen Preisvorschlägen
- Pflegeheim-Zugänge verwalten

## Preislisten-Feature

Das System hilft der Praxis bei der schnellen Rezept-Erstellung:

1. **Preise hinterlegen**: Im Admin-Bereich unter "Preisliste" können zu jedem Produkt mehrere Anbieter mit PZN und Preis eingetragen werden.

2. **Automatische Vorschläge**: Bei jeder Bestellung werden den Mitarbeitern automatisch die 3 günstigsten Anbieter angezeigt (inkl. PZN für direkte Rezept-Erfassung).

3. **Beispiel**: Ein Pflegeheim bestellt "Mullkompressen steril". Die Praxis sieht sofort:
   - MediCare Plus (PZN: 23456789) - 3,99 € ⭐ Bester Preis
   - MediMax GmbH (PZN: 12345678) - 4,49 €
   - Apotheke am Park (PZN: 01234567) - 4,99 €

## Datenschutz

- Gesundheitsdaten werden verschlüsselt gespeichert
- Patientendaten automatische Löschung nach 3 Jahren (konfigurierbar)
- Zugriff nur für autorisierte Benutzer
