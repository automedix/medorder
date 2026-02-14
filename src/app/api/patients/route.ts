import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    console.log('GET /api/patients - Session:', JSON.stringify(session))
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    if (session.role !== 'careHome') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const careHomeId = session.userId
    
    if (!careHomeId) {
      return NextResponse.json({ error: 'Keine CareHome ID' }, { status: 400 })
    }

    console.log('Fetching patients for careHomeId:', careHomeId)

    const patients = await prisma.patient.findMany({
      where: { 
        careHomeId,
        isArchived: false
      },
      orderBy: { lastName: 'asc' }
    })
    
    console.log('Found patients:', patients.length)
    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    console.log('POST /api/patients - Session:', JSON.stringify(session))
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    if (session.role !== 'careHome') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const careHomeId = session.userId
    
    if (!careHomeId) {
      return NextResponse.json({ error: 'Keine CareHome ID' }, { status: 400 })
    }

    const body = await request.json()
    const { firstName, lastName, dateOfBirth } = body
    
    console.log('Creating patient:', { firstName, lastName, dateOfBirth, careHomeId })
    
    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich' }, { status: 400 })
    }

    const patient = await prisma.patient.create({
      data: {
        careHomeId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        isActive: true,
        isArchived: false
      }
    })
    
    console.log('Patient created:', patient.id)
    return NextResponse.json(patient, { status: 201 })
  } catch (error: any) {
    console.error('Error creating patient:', error)
    return NextResponse.json({ error: error.message || 'Datenbankfehler' }, { status: 500 })
  }
}