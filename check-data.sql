-- Datenbank-Konsistenzprüfung für medorder
-- Führe aus mit: sqlite3 prisma/dev.db < check-data.sql

-- =====================================================
-- 1. ÜBERSICHT: Produkt-Preis-Zuordnungen
-- =====================================================

SELECT '=== PRODUKT-PREIS ÜBERSICHT ===' as info;

SELECT 
    p.id as produkt_id,
    p.name as produkt_name,
    p.unit as einheit,
    c.name as kategorie,
    COUNT(pp.id) as anzahl_preise,
    MIN(pp.price) as guenstigster_preis,
    MAX(pp.price) as teuerster_preis
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
LEFT JOIN product_prices pp ON pp.productId = p.id AND pp.isActive = 1
GROUP BY p.id
ORDER BY c.name, p.name;

-- =====================================================
-- 2. KRITISCH: Produkte OHNE Preise
-- =====================================================

SELECT '=== PRODUKTE OHNE PREISE (MÜSSEN GEPFLEGT WERDEN) ===' as info;

SELECT 
    p.id,
    p.name as produkt_name,
    p.unit,
    c.name as kategorie
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
LEFT JOIN product_prices pp ON pp.productId = p.id AND pp.isActive = 1
WHERE pp.id IS NULL
ORDER BY c.name, p.name;

-- =====================================================
-- 3. PRODUKT PREIS-DETAILS (nur Produkte MIT Preisen)
-- =====================================================

SELECT '=== PREISDETAILS PRO PRODUKT ===' as info;

SELECT 
    p.name as produkt,
    pp.pzn,
    pp.supplier as lieferant,
    printf('%.2f€', pp.price) as preis,
    pp.packSize as packung
FROM products p
JOIN product_prices pp ON pp.productId = p.id
WHERE pp.isActive = 1
ORDER BY p.name, pp.price;

-- =====================================================
-- 4. VERDACHT AUF FEHLZUORDNUNGEN
--    Prüfe ob Preise vom falschen Produkt kommen
-- =====================================================

SELECT '=== PRODUKTE MIT ÄHNLICHEN NAMEN (z.B. versch. Größen) ===' as info;

-- Produkte mit ähnlichen Namen in derselben Kategorie
-- (könnten versehentlich verwechselt werden)
SELECT 
    c.name as kategorie,
    p1.name as produkt_1,
    p2.name as produkt_2,
    (SELECT COUNT(*) FROM product_prices WHERE productId = p1.id AND isActive = 1) as preise_p1,
    (SELECT COUNT(*) FROM product_prices WHERE productId = p2.id AND isActive = 1) as preise_p2
FROM products p1
JOIN products p2 ON p1.categoryId = p2.categoryId 
    AND p1.id < p2.id  -- vermeide Duplikate
    AND (
        -- Produkte mit ähnlichem Namensanfang
        (p1.name LIKE 'Schaumverband%' AND p2.name LIKE 'Schaumverband%') OR
        (p1.name LIKE 'Mullkompressen%' AND p2.name LIKE 'Mullkompressen%') OR
        (p1.name LIKE 'Mullbinden%' AND p2.name LIKE 'Mullbinden%') OR
        (p1.name LIKE 'Pflaster%' AND p2.name LIKE 'Pflaster%') OR
        (p1.name LIKE 'Einmalspritzen%' AND p2.name LIKE 'Einmalspritzen%') OR
        (p1.name LIKE 'Kanülen%' AND p2.name LIKE 'Kanülen%') OR
        (p1.name LIKE 'Untersuchungshandschuhe%' AND p2.name LIKE 'Untersuchungshandschuhe%')
    )
JOIN categories c ON p1.categoryId = c.id
ORDER BY c.name, p1.name, p2.name;

-- =====================================================
-- 5. BESTELLUNGEN: Produkte in aktuellen Bestellungen
--    mit ihren verknüpften Preisen
-- =====================================================

SELECT '=== AKTUELLE BESTELLUNGEN: PRODUKTE UND IHRE PREISE ===' as info;

SELECT 
    o.orderNumber as bestellung,
    oi.productName as bestellter_artikel,
    oi.quantity as menge,
    oi.productUnit as einheit,
    p.name as tatsaechliches_produkt_in_db,
    COUNT(pp.id) as verfuegbare_preise
FROM orders o
JOIN order_items oi ON oi.orderId = o.id
LEFT JOIN products p ON oi.productId = p.id
LEFT JOIN product_prices pp ON pp.productId = p.id AND pp.isActive = 1
WHERE o.status = 'PENDING'
GROUP BY o.id, oi.id
ORDER BY o.createdAt DESC;

-- =====================================================
-- 6. KRITISCH: Preise die möglicherweise falsch zugeordnet sind
--    (Preise für ein Produkt, aber PZN passt zu anderem)
-- =====================================================

SELECT '=== PLAUSIBILITÄTSPRÜFUNG: PZN Muster ===' as info;

SELECT 
    p.name as produkt_name,
    pp.pzn,
    pp.supplier,
    printf('%.2f€', pp.price) as preis,
    CASE 
        WHEN pp.pzn NOT LIKE '%________' THEN '⚠️ PZN zu kurz'
        WHEN (p.name LIKE '%10x10%' OR p.name LIKE '%10 x 10%') AND pp.packSize LIKE '%7.5%' THEN '⚠️ Größe passt nicht!'
        WHEN (p.name LIKE '%7.5x7.5%' OR p.name LIKE '%7,5%') AND pp.packSize LIKE '%10%' THEN '⚠️ Größe passt nicht!'
        ELSE '✓ OK'
    END as hinweis
FROM product_prices pp
JOIN products p ON pp.productId = p.id
WHERE pp.isActive = 1
ORDER BY 
    CASE 
        WHEN (p.name LIKE '%10x10%' OR p.name LIKE '%10 x 10%') AND pp.packSize LIKE '%7.5%' THEN 1
        WHEN (p.name LIKE '%7.5x7.5%' OR p.name LIKE '%7,5%') AND pp.packSize LIKE '%10%' THEN 1
        ELSE 2
    END,
    p.name, pp.price;

-- =====================================================
-- ZUSAMMENFASSUNG
-- =====================================================

SELECT '=== ZUSAMMENFASSUNG ===' as info;

SELECT 
    'Produkte gesamt' as metrik,
    COUNT(*) as wert
FROM products
UNION ALL
SELECT 
    'Produkte mit Preisen',
    COUNT(DISTINCT p.id)
FROM products p
JOIN product_prices pp ON pp.productId = p.id AND pp.isActive = 1
UNION ALL
SELECT 
    'Produkte OHNE Preise',
    COUNT(*)
FROM products p
LEFT JOIN product_prices pp ON pp.productId = p.id AND pp.isActive = 1
WHERE pp.id IS NULL
UNION ALL
SELECT 
    'Aktive Preise gesamt',
    COUNT(*)
FROM product_prices
WHERE isActive = 1;
