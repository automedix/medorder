import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    if (session.role !== 'careHome') {
      console.error('Wrong role:', session.role)
      return NextResponse.json({ error: 'Unauthorized - Wrong role' }, { status: 401 })
    }

    // Get careHomeId from session
    const careHomeId = session.userId
    
    if (!careHomeId) {
      console.error('No careHomeId in session:', session)
      return NextResponse.json({ error: 'Session invalid' }, { status: 401 })
    }

    const patients = await prisma.patient.findMany({
      where: { 
        careHomeId,
        isActive: true,
        isArchived: false
      },
      orderBy: { lastName: 'asc' }
    })
    
    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    if (session.role !== 'careHome') {
      console.error('Wrong role:', session.role)
      return NextResponse.json({ error: 'Unauthorized - Wrong role' }, { status: 401 })
    }

    const careHomeId = session.userId
    
    if (!careHomeId) {
      console.error('No careHomeId in session:', session)
      return NextResponse.json({ error: 'Session invalid' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, dateOfBirth } = body
    
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
    
    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}