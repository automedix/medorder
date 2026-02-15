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
    // ID aus der URL parsen (robuster für alle Next.js Versionen)
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    
    if (!id || id === '[id]') {
      console.error('PATCH prices: No ID found in URL:', url.pathname)
      return NextResponse.json({ error: 'Preis-ID erforderlich' }, { status: 400 })
    }

    console.log('PATCH prices: Updating price with ID:', id)

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

    console.log('PATCH prices: Successfully updated:', productPrice.id)
    return NextResponse.json(productPrice)
  } catch (error) {
    console.error('PATCH prices error:', error)
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
    // ID aus der URL parsen
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    
    if (!id || id === '[id]') {
      console.error('DELETE prices: No ID found in URL:', url.pathname)
      return NextResponse.json({ error: 'Preis-ID erforderlich' }, { status: 400 })
    }

    console.log('DELETE prices: Soft-deleting price with ID:', id)

    await prisma.productPrice.update({
      where: { id },
      data: { isActive: false },
    })

    console.log('DELETE prices: Successfully deleted:', id)
    return NextResponse.json({ message: 'Preis gelöscht' })
  } catch (error) {
    console.error('DELETE prices error:', error)
    return NextResponse.json({ error: 'Failed to delete price' }, { status: 500 })
  }
}
