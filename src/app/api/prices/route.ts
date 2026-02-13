import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Preise für ein Produkt oder alle Preise
export async function GET(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')

  try {
    const prices = await prisma.productPrice.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
      orderBy: {
        price: 'asc',
      },
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}

// POST: Neuen Preis anlegen
export async function POST(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { productId, pzn, supplier, price, packSize } = body

    if (!productId || !pzn || !supplier || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const productPrice = await prisma.productPrice.create({
      data: {
        productId,
        pzn,
        supplier,
        price,
        packSize: packSize || '',
      },
    })

    return NextResponse.json(productPrice, { status: 201 })
  } catch (error) {
    console.error('Error creating price:', error)
    return NextResponse.json({ error: 'Failed to create price' }, { status: 500 })
  }
}

// PATCH: Preis aktualisieren
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Preis-ID erforderlich' }, { status: 400 })
    }

    const body = await request.json()
    const { pzn, supplier, price, packSize, isActive } = body

    const updateData: any = {}
    if (pzn !== undefined) updateData.pzn = pzn
    if (supplier !== undefined) updateData.supplier = supplier
    if (price !== undefined) updateData.price = price
    if (packSize !== undefined) updateData.packSize = packSize
    if (isActive !== undefined) updateData.isActive = isActive

    const productPrice = await prisma.productPrice.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(productPrice)
  } catch (error) {
    console.error('Error updating price:', error)
    return NextResponse.json({ error: 'Failed to update price' }, { status: 500 })
  }
}

// DELETE: Preis löschen (soft delete)
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Preis-ID erforderlich' }, { status: 400 })
    }

    await prisma.productPrice.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Preis gelöscht' })
  } catch (error) {
    console.error('Error deleting price:', error)
    return NextResponse.json({ error: 'Failed to delete price' }, { status: 500 })
  }
}