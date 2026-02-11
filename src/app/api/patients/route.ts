import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user as any).role !== 'careHome') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const careHomeId = (session.user as any).id

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
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user as any).role !== 'careHome') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const careHomeId = (session.user as any).id
  const body = await request.json()
  
  const { firstName, lastName, dateOfBirth } = body

  try {
    const patient = await prisma.patient.create({
      data: {
        careHomeId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth)
      }
    })
    
    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}
