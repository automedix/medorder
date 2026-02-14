import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/admin/change-password - Eigenes Admin-Passwort ändern
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { masterPassword, newPassword } = body

    // Masterpasswort prüfen
    const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'admin-master-123'
    if (masterPassword !== MASTER_PASSWORD) {
      return NextResponse.json({ error: 'Falsches Masterpasswort' }, { status: 403 })
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen haben' }, { status: 400 })
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Admin updaten
    await prisma.admin.update({
      where: { id: session.userId },
      data: { passwordHash }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}