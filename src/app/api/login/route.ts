import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role: providedRole } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 })
    }

    let user = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } })
    let role = 'admin'

    if (!user) {
      user = await prisma.careHome.findUnique({ where: { email: email.toLowerCase() } })
      role = 'careHome'
    }

    if (providedRole === 'admin') {
      user = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } })
      role = 'admin'
    } else if (providedRole === 'careHome') {
      user = await prisma.careHome.findUnique({ where: { email: email.toLowerCase() } })
      role = 'careHome'
    }

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const token = await new SignJWT({ userId: user.id, email: user.email, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret)

    const response = NextResponse.json({ success: true, user: { email: user.email, role } })
    response.cookies.set('session', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 86400, path: '/' })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
