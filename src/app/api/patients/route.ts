import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
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

    // Keine Debug-Logs mit Session-Daten (PII-Schutz)
    const patients = await prisma.patient.findMany({
      where: { 
        careHomeId,
        isArchived: false
      },
      orderBy: { lastName: 'asc' }
    })
    
    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients') // Keine Details loggen
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
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
    
    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich' }, { status: 400 })
    }

    // Input-Validierung
    const trimmedFirstName = String(firstName).trim().slice(0, 100)
    const trimmedLastName = String(lastName).trim().slice(0, 100)
    
    if (!trimmedFirstName || !trimmedLastName) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
    }

    const patient = await prisma.patient.create({
      data: {
        careHomeId,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        dateOfBirth: new Date(dateOfBirth),
        isActive: true,
        isArchived: false
      }
    })
    
    // Nur ID loggen, keine PII
    console.log('Patient created:', patient.id)
    return NextResponse.json(patient, { status: 201 })
  } catch (error: any) {
    console.error('Error creating patient') // Keine Details loggen
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
