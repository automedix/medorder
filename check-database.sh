#!/bin/bash
# Datenbank-Prüf-Skript für medorder
# Zeigt die aktuelle Datenstruktur und mögliche Probleme

DB_FILE="prisma/dev.db"

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Datenbank nicht gefunden: $DB_FILE"
    echo "   Suche nach .db Dateien..."
    find . -name "*.db" -type f 2>/dev/null
    exit 1
fi

echo "======================================"
echo "  MEDORDER DATENBANK-PRÜFUNG"
echo "======================================"
echo ""

# 1. Anzahl der Datensätze
echo "📊 DATENSÄTZE:"
echo "---------------"
sqlite3 "$DB_FILE" "SELECT 'Kategorien:' as typ, COUNT(*) as anzahl FROM categories UNION SELECT 'Produkte:', COUNT(*) FROM products UNION SELECT 'Preise:', COUNT(*) FROM product_prices UNION SELECT 'Bestellungen:', COUNT(*) FROM orders;"
echo ""

# 2. Produkte mit ihren Preisen (Top 20)
echo "📦 PRODUKTE MIT PREISEN (Top 20):"
echo "----------------------------------"
sqlite3 "$DB_FILE" ".headers on" ".mode column" "SELECT p.id, p.name as produkt, c.name as kategorie, COUNT(pp.id) as preise_count, ROUND(AVG(pp.price), 2) as avg_preis FROM products p LEFT JOIN categories c ON p.categoryId = c.id LEFT JOIN product_prices pp ON pp.productId = p.id AND pp.isActive = 1 GROUP BY p.id ORDER BY preise_count DESC, p.name LIMIT 20;"
echo ""

# 3. Produkte OHNE Preise (Problem!)
echo "⚠️  PRODUKTE OHNE PREISE (müssen gepflegt werden):"
echo "--------------------------------------------------"
sqlite3 "$DB_FILE" ".headers on" ".mode column" "SELECT p.id, p.name, p.unit, c.name as kategorie FROM products p LEFT JOIN categories c ON p.categoryId = c.id LEFT JOIN product_prices pp ON pp.productId = p.id AND pp.isActive = 1 WHERE pp.id IS NULL ORDER BY c.name, p.name;"
echo ""

# 4. Produkte mit mehrfachen Preisen pro Lieferant (mögliches Problem)
echo "🔍 PRODUKTE MIT MEHRFACHEN PREISEN (gleicher Lieferant):"
echo "--------------------------------------------------------"
sqlite3 "$DB_FILE" ".headers on" ".mode column" "SELECT p.name as produkt, pp.supplier, COUNT(*) as eintraege, GROUP_CONCAT(ROUND(pp.price, 2) || '€', ', ') as preise FROM product_prices pp JOIN products p ON pp.productId = p.id WHERE pp.isActive = 1 GROUP BY pp.productId, pp.supplier HAVING COUNT(*) > 1 ORDER BY p.name;"
echo ""

# 5. Detaillierte Preisübersicht für bestimmte Produktgruppen
echo "💰 PREISDETAILS - VERBÄNDE UND PFLASTER:"
echo "----------------------------------------"
sqlite3 "$DB_FILE" ".headers on" ".mode column" "SELECT p.name as produkt, pp.pzn, pp.supplier, ROUND(pp.price, 2) || '€' as preis, pp.packSize as packung FROM products p JOIN product_prices pp ON pp.productId = p.id JOIN categories c ON p.categoryId = c.id WHERE pp.isActive = 1 AND (c.name LIKE '%Verband%' OR c.name LIKE '%Pflaster%' OR c.name LIKE '%Wund%') ORDER BY p.name, pp.price LIMIT 30;"
echo ""

# 6. Letzte 5 Bestellungen mit Artikeln
echo "📋 LETZTE 5 BESTELLUNGEN:"
echo "-------------------------"
sqlite3 "$DB_FILE" ".headers on" ".mode column" "SELECT o.orderNumber as bestellnr, o.status, oi.productName as artikel, oi.quantity as menge, oi.productUnit as einheit FROM orders o JOIN order_items oi ON oi.orderId = o.id ORDER BY o.createdAt DESC LIMIT 10;"
echo ""

echo "======================================"
echo "  PRÜFUNG ABGESCHLOSSEN"
echo "======================================"
echo ""
echo "💡 Tipps:"
echo "   - Produkte ohne Preise müssen in /admin/prices gepflegt werden"
echo "   - Mehrfache Preise pro Lieferant: alte Preise auf isActive=0 setzen"
echo "   - Bei falschen Produktzuordnungen: productId in product_prices prüfen"
