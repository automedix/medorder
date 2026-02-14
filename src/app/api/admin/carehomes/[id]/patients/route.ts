import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/carehomes/[id]/patients - Alle Patienten eines Pflegeheims
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const patients = await prisma.patient.findMany({
      where: {
        careHomeId: id
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching care home patients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
