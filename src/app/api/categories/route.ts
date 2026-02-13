import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Kategorien
export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST: Neue Kategorie anlegen
export async function POST(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { name, description } = data

    if (!name) {
      return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 })
    }

    // Höchste sortOrder finden
    const lastCategory = await prisma.category.findFirst({
      orderBy: { sortOrder: 'desc' }
    })
    const sortOrder = (lastCategory?.sortOrder || 0) + 1

    const category = await prisma.category.create({
      data: {
        name,
        description,
        sortOrder,
        isActive: true
      }
    })
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
