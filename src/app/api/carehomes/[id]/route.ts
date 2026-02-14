import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/carehomes/[id] - Pflegeheim abrufen
export async function GET(
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
      return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })
    }

    const careHome = await prisma.careHome.findUnique({
      where: { id },
      include: {
        patients: {
          where: { isArchived: false },
          orderBy: { lastName: 'asc' }
        }
      }
    })

    if (!careHome) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(careHome)
  } catch (error) {
    console.error('Error fetching care home:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/carehomes/[id] - Pflegeheim aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id } = await params

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