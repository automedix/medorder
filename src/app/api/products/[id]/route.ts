import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

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