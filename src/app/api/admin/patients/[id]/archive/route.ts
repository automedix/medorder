import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/patients/[id]/archive - Patient archivieren/dearchivieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Next.js 14+: params ist ein Promise
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Patient ID fehlt' }, { status: 400 })
    }

    const data = await request.json()
    const { isArchived, archiveNote } = data

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        isArchived,
        archiveNote: isArchived ? archiveNote : null,
        archivedAt: isArchived ? new Date() : null
      }
    })

    return NextResponse.json(patient)
  } catch (error: any) {
    console.error('Error archiving patient:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}