import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Produkte
export async function GET(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST: Neues Produkt anlegen
export async function POST(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { name, description, articleNumber, unit, categoryId } = data

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name und Kategorie erforderlich' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        articleNumber,
        unit: unit || 'Stück',
        categoryId,
        isActive: true
      },
      include: { category: true }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
