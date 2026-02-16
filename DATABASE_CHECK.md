# Datenbank-Validierung

Diese Skripte helfen dir, die Datenintegrität des medorder-Systems zu prüfen.

## Schnellstart

```bash
# Alle Prüfungen ausführen
./check-database.sh

# Oder nur SQL-Abfragen
sqlite3 prisma/dev.db < check-data.sql

# Oder mit Prisma (detaillierter)
npx ts-node scripts/validate-db.ts
```

## Skripte

### 1. `check-database.sh`
**Bash-Skript für schnelle Übersicht**

Zeigt:
- Anzahl Kategorien, Produkte, Preise, Bestellungen
- Produkte mit/ohne Preise
- Mehrfache Preise pro Lieferant
- Letzte Bestellungen

**Verwendung:**
```bash
./check-database.sh
```

### 2. `check-data.sql`
**SQL-Skript für detaillierte Abfragen**

Enthält:
- Produkt-Preis-Übersicht
- Produkte ohne Preise
- Ähnliche Produkte (z.B. 10x10cm vs 7.5x7.5cm)
- Plausibilitätsprüfungen (PZN, Größenangaben)
- Aktuelle Bestellungen

**Verwendung:**
```bash
# Interaktiv
sqlite3 prisma/dev.db

# Oder direkt
sqlite3 prisma/dev.db < check-data.sql
```

### 3. `scripts/validate-db.ts`
**TypeScript-Skript mit Prisma**

Prüft:
- ✅ Alle Produkte haben Preise?
- ✅ PZNs haben plausible Länge?
- ✅ Keine doppelten Lieferanten-Preise?
- ✅ Ähnliche Produkte (Größen-Verwechslung)?
- ✅ Bestellungen sind korrekt verknüpft?

**Verwendung:**
```bash
npx ts-node scripts/validate-db.ts
```

## Häufige Probleme

### Problem: "Produkte ohne Preise"
**Lösung:**
1. In den Admin-Bereich gehen (`/admin/prices`)
2. Für jedes Produkt mindestens einen Preis anlegen
3. Alternativ: SQL-Import verwenden

### Problem: "Mehrfache Preise vom gleichen Lieferanten"
**Lösung:**
```sql
-- Alte Preise deaktivieren, neuesten behalten
UPDATE product_prices 
SET isActive = 0 
WHERE id IN (
  SELECT id FROM product_prices 
  WHERE supplier = 'Anbietername' 
  AND productId = 'produkt-id'
  AND createdAt < (SELECT MAX(createdAt) FROM product_prices WHERE supplier = 'Anbietername' AND productId = 'produkt-id')
);
```

### Problem: "Schaumverband 10x10cm zeigt Preise von 7.5x7.5cm"
**Ursache:** 
- Produkt-IDs sind falsch verknüpft
- Oder: Preise wurden mit falscher `productId` gespeichert

**Prüfung:**
```sql
-- Preise für Schaumverbände anzeigen
SELECT p.name, pp.pzn, pp.supplier, pp.price, pp.packSize
FROM product_prices pp
JOIN products p ON pp.productId = p.id
WHERE p.name LIKE '%Schaumverband%'
ORDER BY p.name, pp.price;
```

**Fix:**
- In `/admin/prices` die Preise korrigieren
- Oder direkt in der Datenbank: `productId` aktualisieren

## Datenbank-Struktur

```
Category (id, name)
  ↓
Product (id, name, categoryId, unit)
  ↓
ProductPrice (id, productId, pzn, supplier, price, isActive)

Order (id, orderNumber, status)
  ↓
OrderItem (id, orderId, productId, productName, quantity)
```

## Wichtige SQL-Abfragen

```sql
-- Alle Preise eines Produkts
SELECT * FROM product_prices 
WHERE productId = 'PRODUKT-ID' 
AND isActive = 1 
ORDER BY price;

-- Produkt-ID zu Name finden
SELECT id, name FROM products 
WHERE name LIKE '%Schaumverband 10x10%';

-- Preise auf anderes Produkt umhängen
UPDATE product_prices 
SET productId = 'KORREKTE-PRODUKT-ID' 
WHERE id = 'PREIS-ID';
```
