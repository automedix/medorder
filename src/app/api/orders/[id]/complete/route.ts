import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID fehlt' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy: session.name || 'Admin'
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error completing order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}