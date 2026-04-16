# MedOrder - Verbandstoff-Verwaltung

## Überblick

MedOrder ist ein Open-Source-System zur Verwaltung von Verbandstoff-Bestellungen zwischen Pflegeheimen und Arztpraxen. Die Software ermöglicht eine effiziente, digitale Bestellabwicklung mit automatischer Preisoptimierung.

## Features

- **Digitale Bestellungen**: Pflegeheime können Verbandstoffe direkt bei der Praxis bestellen
- **Preisoptimierung**: Automatische Auswahl der günstigsten verfügbaren Anbieter
- **PZN-Datenbank**: Vollständige Produktdaten mit Pharmazentralnummern
- **Mehrere Produktgruppen**: Schaumstoffverbände, Hydrocolloide, Alginate, Silber-Verbände, etc.

## Produktgruppen (AOK-Nordwest kompatibel)

- Schaumstoffverbände (4x5cm bis 7.5x7.5cm, Ferse, Premium)
- Hydrocolloidverbände
- Alginate
- Transparentfolien
- Vlieskompressen
- Fixierverbände
- Silber-Verbände

## Technologie

- Next.js 16
- Prisma ORM
- SQLite Datenbank
- JWT Authentifizierung

## Installation

```bash
npm install
cp .env.example .env
# .env anpassen
npx prisma migrate dev
npm run dev
```

## Lizenz

MIT License - siehe LICENSE Datei

## Datenquelle

Die Produktdaten basieren auf der AOK-Nordwest Preisübersicht für Verbandstoffe (Stand 2025).

## Autor

automedix - Open Source Healthcare Solutions
