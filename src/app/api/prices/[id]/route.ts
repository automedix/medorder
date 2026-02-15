import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH: Preis aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
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
