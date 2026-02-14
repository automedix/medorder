import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/patients - Liste aller Patienten (inkl. archivierte)
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patients = await prisma.patient.findMany({
      include: {
        careHome: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: { lastName: 'asc' }
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
