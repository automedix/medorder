import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    // Auth Check
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Start of today for "Bestellungen heute"
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch all stats in parallel
    const [
      pendingOrdersCount,
      activeCareHomesCount,
      activeProductsCount,
      todayOrdersCount,
    ] = await Promise.all([
      // Offene Bestellungen (PENDING)
      prisma.order.count({
        where: {
          status: 'PENDING',
        },
      }),

      // Aktive Pflegeheime
      prisma.careHome.count({
        where: {
          isActive: true,
        },
      }),

      // Produkte im Sortiment (isActive: true)
      prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      // Bestellungen heute
      prisma.order.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ])

    return NextResponse.json({
      pendingOrders: pendingOrdersCount,
      activeCareHomes: activeCareHomesCount,
      activeProducts: activeProductsCount,
      todayOrders: todayOrdersCount,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
