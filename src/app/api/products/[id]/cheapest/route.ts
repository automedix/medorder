import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Top 3 günstigste Preise für ein Produkt
// WICHTIG: Nur Preise für das EXAKT angefragte Produkt zurückgeben,
// nicht für ähnliche Produkte in der gleichen Kategorie
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Zuerst das Produkt mit seiner Kategorie laden (für Debugging)
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 2. NUR Preise für das exakte Produkt holen (nicht für ähnliche Produkte)
    const prices = await prisma.productPrice.findMany({
      where: {
        productId: params.id,
        isActive: true,
      },
      orderBy: {
        price: 'asc',
      },
      take: 3,
    })

    // 3. Zurückgeben mit Produkt-Info für Verifizierung
    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        unit: product.unit,
        category: product.category.name
      },
      prices: prices
    })
  } catch (error) {
    console.error('Error fetching cheapest prices:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}