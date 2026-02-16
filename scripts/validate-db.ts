/**
 * Datenbank-Validierungsskript für medorder
 * 
 * Führe aus mit:
 *   npx ts-node scripts/validate-db.ts
 *   oder: node --loader ts-node/esm scripts/validate-db.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationResult {
  ok: boolean;
  message: string;
  details?: any[];
}

async function validateDatabase(): Promise<void> {
  console.log('🔍 MEDORDER Datenbank-Validierung\n');
  console.log('=' .repeat(50));

  const results: ValidationResult[] = [];

  // 1. Produkte ohne Preise
  console.log('\n📦 Prüfe: Produkte ohne Preise...');
  const productsWithoutPrices = await prisma.product.findMany({
    where: {
      prices: {
        none: {
          isActive: true
        }
      }
    },
    include: {
      category: true
    },
    orderBy: {
      category: {
        name: 'asc'
      }
    }
  });

  if (productsWithoutPrices.length === 0) {
    results.push({ ok: true, message: '✅ Alle Produkte haben Preise' });
  } else {
    results.push({
      ok: false,
      message: `⚠️  ${productsWithoutPrices.length} Produkte haben KEINE Preise:`,
      details: productsWithoutPrices.map(p => `   - ${p.name} (${p.category?.name})`)
    });
  }

  // 2. Preise mit ungültigen/verdächtigen PZNs
  console.log('💳 Prüfe: PZN-Validität...');
  const allPrices = await prisma.productPrice.findMany({
    where: { isActive: true },
    include: { product: true }
  });

  const suspiciousPZNs = allPrices.filter(pp => {
    // PZN sollte 8 Stellen haben (manchmal mit führender 0)
    const pznClean = pp.pzn.replace(/\D/g, '');
    return pznClean.length < 7 || pznClean.length > 9;
  });

  if (suspiciousPZNs.length === 0) {
    results.push({ ok: true, message: '✅ Alle PZNs haben plausible Länge' });
  } else {
    results.push({
      ok: false,
      message: `⚠️  ${suspiciousPZNs.length} PZNs haben ungewöhnliche Länge:`,
      details: suspiciousPZNs.slice(0, 5).map(p => 
        `   - ${p.product.name}: PZN "${p.pzn}" (${p.pzn.length} Zeichen)`
      )
    });
  }

  // 3. Mehrfache Preise vom gleichen Lieferanten für ein Produkt
  console.log('🏪 Prüfe: Doppelte Lieferanten-Preise...');
  const duplicateSuppliers = await prisma.$queryRaw`
    SELECT 
      p.name as productName,
      pp.supplier,
      COUNT(*) as count,
      GROUP_CONCAT(printf('%.2f€', pp.price), ', ') as prices
    FROM ProductPrice pp
    JOIN Product p ON pp.productId = p.id
    WHERE pp.isActive = 1
    GROUP BY pp.productId, pp.supplier
    HAVING COUNT(*) > 1
  ` as Array<{productName: string, supplier: string, count: number, prices: string}>;

  if (duplicateSuppliers.length === 0) {
    results.push({ ok: true, message: '✅ Keine doppelten Lieferanten-Preise' });
  } else {
    results.push({
      ok: false,
      message: `⚠️  ${duplicateSuppliers.length} Produkte haben mehrere Preise vom gleichen Lieferanten:`,
      details: duplicateSuppliers.map(d => 
        `   - ${d.productName} / ${d.supplier}: ${d.prices}`
      )
    });
  }

  // 4. Ähnliche Produkte (potenzielle Verwechslung)
  console.log('🔄 Prüfe: Ähnliche Produkte (Größen-Verwechslung)...');
  const products = await prisma.product.findMany({
    include: { category: true, prices: { where: { isActive: true } } }
  });

  const similarProducts: Array<{p1: string, p2: string, cat: string, diff: string}> = [];
  
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const p1 = products[i];
      const p2 = products[j];
      
      // Nur Produkte in derselben Kategorie
      if (p1.categoryId !== p2.categoryId) continue;
      
      // Ähnlicher Name (z.B. "Schaumverband 10x10" vs "Schaumverband 7.5x7.5")
      const name1 = p1.name.toLowerCase();
      const name2 = p2.name.toLowerCase();
      
      // Extrahiere Basisnamen (ohne Größen)
      const base1 = name1.replace(/\d+[x,]\d+\s*cm/g, '').trim();
      const base2 = name2.replace(/\d+[x,]\d+\s*cm/g, '').trim();
      
      if (base1 === base2 && base1.length > 5) {
        const size1 = name1.match(/(\d+[x,]\d+\s*cm)/)?.[0] || '?';
        const size2 = name2.match(/(\d+[x,]\d+\s*cm)/)?.[0] || '?';
        similarProducts.push({
          p1: p1.name,
          p2: p2.name,
          cat: p1.category?.name || '',
          diff: `${size1} vs ${size2}`
        });
      }
    }
  }

  if (similarProducts.length === 0) {
    results.push({ ok: true, message: '✅ Keine ähnlichen Produkte mit Größenunterschied gefunden' });
  } else {
    results.push({
      ok: true,  // Das ist nur informativ, nicht unbedingt ein Fehler
      message: `ℹ️  ${similarProducts.length} Produktpaare mit Größen-Varianten gefunden:`,
      details: similarProducts.map(s => 
        `   - ${s.p1} vs ${s.p2} (${s.diff})`
      )
    });
  }

  // 5. Aktuelle Bestellungen und ihre Produkt-Verknüpfungen
  console.log('📋 Prüfe: Bestellungen mit Produkt-Verknüpfungen...');
  const recentOrders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            include: {
              prices: { where: { isActive: true } },
              category: true
            }
          }
        }
      }
    }
  });

  console.log('\n📦 Letzte offene Bestellungen:');
  for (const order of recentOrders) {
    console.log(`\n   Bestellung ${order.orderNumber}:`);
    for (const item of order.items) {
      const priceCount = item.product?.prices?.length || 0;
      const category = item.product?.category?.name || 'N/A';
      console.log(`     - ${item.productName} (${category}): ${priceCount} Preise`);
      
      if (item.product && item.productName !== item.product.name) {
        console.log(`       ⚠️  Namens-Mismatch! Bestellung: "${item.productName}" vs DB: "${item.product.name}"`);
      }
    }
  }

  // Ergebnisse ausgeben
  console.log('\n' + '='.repeat(50));
  console.log('ZUSAMMENFASSUNG\n');
  
  let errorCount = 0;
  for (const result of results) {
    console.log(result.message);
    if (result.details) {
      result.details.forEach(d => console.log(d));
    }
    if (!result.ok) errorCount++;
    console.log('');
  }

  // Statistik
  const stats = await prisma.$transaction([
    prisma.product.count(),
    prisma.productPrice.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: 'PENDING' } })
  ]);

  console.log('📊 Statistik:');
  console.log(`   Produkte: ${stats[0]}`);
  console.log(`   Aktive Preise: ${stats[1]}`);
  console.log(`   Offene Bestellungen: ${stats[2]}`);

  if (errorCount === 0) {
    console.log('\n✅ Alle Prüfungen bestanden!');
  } else {
    console.log(`\n⚠️  ${errorCount} Problem(e) gefunden.`);
  }

  await prisma.$disconnect();
}

validateDatabase().catch(e => {
  console.error('Fehler:', e);
  process.exit(1);
});
