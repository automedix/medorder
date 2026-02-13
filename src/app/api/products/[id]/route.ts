import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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