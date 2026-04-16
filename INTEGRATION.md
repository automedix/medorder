# Verbandstoffe-Datenbank Integration für medorder

## Überblick

Diese Datenbank enthält Schaumstoffverbände aus der AOK-Nordwest Preisübersicht (Stand 01.11.2025, gültig bis 31.12.2026).

## Dateien

1. **`seed-verbandstoffe.sql`** - SQL Seed-Daten für Prisma/SQLite
2. **`verbandstoffe-api.json`** - JSON API-Format für direkte Integration
3. **`verbandstoffe_raw.md`** - Rohdaten aus dem PDF

## Produktdesign-Philosophie

### Eine Größe = Ein Produkt

Anstatt jeden Hersteller als separates Produkt zu führen, wird pro Größe **ein Produkt** angelegt mit mehreren Preisen:

- **Produkt**: "Schaumstoffverband 7.5x7.5 cm"
- **Preise**: Mehrere Anbieter mit unterschiedlichen Packungsgrößen
- **Automatische Auswahl**: Das System wählt den günstigsten Preis

### Vorteile

1. **Einfache Bestellung**: Pflegepersonal bestellt "7.5x7.5 cm Schaumstoffverband"
2. **Kostenoptimierung**: Automatisch günstigster Anbieter wird gewählt
3. **Packungsgrößen-Berücksichtigung**: System berechnet optimale Packungsanzahl
4. **Keine Überforderung**: Keine Auswahl aus 20+ ähnlichen Produkten

## Produktgruppen

| Produkt | Größe | Günstigster Preis | Anbieter |
|---------|-------|-------------------|----------|
| Schaumstoffverband klein | 4x5 cm | 1,87 € | KLINIDERM foam (Mediq) |
| Schaumstoffverband klein | 5x5 cm | 1,96 € | NOBASPONGE-Border (NOBAMED) |
| Schaumstoffverband mittel | 6x8.5 cm | 5,48 € | MEPILEX Lite (ApoHomeCare) |
| Schaumstoffverband mittel | 7.5x7.5 cm | 8,17 € | DRACOFOAM Haft (Dr. Ausbüttel) |
| Schaumstoffverband mittel | 5x7 cm | 8,88 € | ASKINA DresSil (B. Braun) |
| Schaumstoffverband Premium | 7.5x7.5 cm | 18,52 € | ALLEVYN Gentle (Smith & Nephew) |

## Integration in medorder

### Option 1: Direkte SQL-Integration

```bash
# SQLite Datenbank aktualisieren
cd /path/to/medorder
sqlite3 prisma/dev.db < medorder-db/seed-verbandstoffe.sql
```

### Option 2: Prisma Seed Script

```typescript
// prisma/seed.ts erweitern
import verbandstoffeData from '../medorder-db/verbandstoffe-api.json';

async function seedVerbandstoffe() {
  // Kategorie erstellen
  const category = await prisma.category.create({
    data: verbandstoffeData.category
  });
  
  // Produkte mit Preisen erstellen
  for (const product of verbandstoffeData.products) {
    await prisma.product.create({
      data: {
        id: product.id,
        categoryId: category.id,
        name: product.name,
        description: product.description,
        articleNumber: product.articleNumber,
        unit: product.unit,
        isActive: true,
        prices: {
          create: product.allPrices.map(p => ({
            pzn: p.pzn,
            supplier: p.supplier,
            price: p.price,
            packSize: p.packSize,
            isActive: true
          }))
        }
      }
    });
  }
}
```

### Option 3: API-Endpoint für günstigsten Preis

```typescript
// app/api/products/[id]/cheapest/route.ts
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { prices: { where: { isActive: true } } }
  });
  
  if (!product) return Response.json({ error: 'Not found' }, { status: 404 });
  
  const cheapest = product.prices.reduce((min, p) => 
    p.price < min.price ? p : min
  );
  
  return Response.json({
    product: product.name,
    cheapestPrice: cheapest.price,
    supplier: cheapest.supplier,
    packSize: cheapest.packSize,
    pzn: cheapest.pzn
  });
}
```

## Bestell-Workflow

1. **Pflegeheim wählt Produkt**: "Schaumstoffverband 7.5x7.5 cm"
2. **Gibt Menge ein**: z.B. 25 Stück
3. **System berechnet**:
   - Günstigster Preis: 8,17 € (Dr. Ausbüttel, 10er-Pack)
   - Benötigt: 3 Packungen (30 Stück)
   - Gesamtkosten: 3 × 81,70 € = 245,10 €
   - Alternativ: 2 Packungen (20 Stück) + 5 Einzelstücke (falls verfügbar)
4. **Bestellung wird erstellt** mit automatisch gewähltem Anbieter

## Hinweise für die Praxis

- **Packungsgrößen beachten**: Kleinere Packungen sind oft pro Stück teurer
- **Standardgrößen bevorzugen**: 10x10 cm oder 100 cm² sind meist wirtschaftlicher
- **Haftränder prüfen**: "Border"-Produkte haben oft Zuschläge
- **Lieferantenwechsel**: System wählt automatisch - kein manueller Vergleich nötig

## Rechtlicher Hinweis

Diese Preisdaten basieren auf der AOK-Nordwest Preisübersicht vom 01.11.2025.
Gültigkeit: Bis 31.12.2026 für wirkstofffreisetzende Wundauflagen.

Preise können sich ändern - regelmäßige Updates empfohlen.
