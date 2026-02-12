import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'

// GET /api/carehomes - Liste aller Pflegeheime
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const careHomes = await prisma.careHome.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(careHomes)
  } catch (error) {
    console.error('Error fetching care homes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/carehomes - Neues Pflegeheim anlegen
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { name, email, contactPerson, phone, address, password } = data

    // Prüfen ob E-Mail bereits existiert
    const existing = await prisma.careHome.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'E-Mail bereits registriert' },
        { status: 400 }
      )
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 10)

    const careHome = await prisma.careHome.create({
      data: {
        name,
        email,
        contactPerson,
        phone,
        address,
        passwordHash,
        isActive: true
      }
    })

    return NextResponse.json(careHome, { status: 201 })
  } catch (error) {
    console.error('Error creating care home:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
