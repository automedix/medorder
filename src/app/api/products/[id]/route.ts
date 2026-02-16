import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH: Produkt aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await Promise.resolve(params)
  const { id } = resolvedParams

  if (!id) {
    return NextResponse.json({ error: 'Produkt-ID erforderlich' }, { status: 400 })
  }

  try {
    const data = await request.json()
    const { name, description, articleNumber, unit, categoryId } = data

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (articleNumber !== undefined) updateData.articleNumber = articleNumber
    if (unit !== undefined) updateData.unit = unit
    if (categoryId !== undefined) updateData.categoryId = categoryId

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Produkt konnte nicht aktualisiert werden' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Handle both sync and async params (Next.js 15 compatibility)
  const resolvedParams = await Promise.resolve(params)
  const { id } = resolvedParams

  if (!id) {
    return NextResponse.json({ error: 'Produkt-ID erforderlich' }, { status: 400 })
  }

  try {
    // Soft delete - set isActive to false
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Produkt gelöscht', product })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Produkt konnte nicht gelöscht werden' }, { status: 500 })
  }
}