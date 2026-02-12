import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// PATCH /api/carehomes/[id] - Pflegeheim aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id } = params

    const careHome = await prisma.careHome.update({
      where: { id },
      data
    })

    return NextResponse.json(careHome)
  } catch (error) {
    console.error('Error updating care home:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
