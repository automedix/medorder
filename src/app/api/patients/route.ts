import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'careHome') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const careHomeId = session.id

  try {
    const patients = await prisma.patient.findMany({
      where: { 
        careHomeId,
        isActive: true 
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
  const session = await getSession()
  
  if (!session || session.role !== 'careHome') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const careHomeId = session.id
  
  try {
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
        dateOfBirth: new Date(dateOfBirth)
      }
    })
    
    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}