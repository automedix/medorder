import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Top 3 günstigste Preise für ein Produkt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching cheapest prices:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}