import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/archive/patients - Liste aller archivierten Patienten
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patients = await prisma.patient.findMany({
      where: { 
        isArchived: true 
      },
      include: {
        careHome: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            totalItems: true
          }
        }
      },
      orderBy: { archivedAt: 'desc' }
    })

    // Gruppiere Patienten nach Pflegeheim
    const groupedByCareHome = patients.reduce((acc, patient) => {
      const careHomeId = patient.careHome.id
      if (!acc[careHomeId]) {
        acc[careHomeId] = {
          careHome: patient.careHome,
          patients: []
        }
      }
      acc[careHomeId].patients.push(patient)
      return acc
    }, {} as Record<string, { careHome: { id: string; name: string; email: string }; patients: typeof patients }>)

    return NextResponse.json(groupedByCareHome)
  } catch (error) {
    console.error('Error fetching archived patients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
