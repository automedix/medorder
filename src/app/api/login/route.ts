import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

// Rate Limiting: Max 5 Versuche, dann 30 Min Sperre
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 * 60 * 1000

const loginAttempts: Record<string, number> = {}
const lockedIPs: Record<string, number> = {}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // IP ermitteln
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Prüfen ob IP gesperrt ist
    if (lockedIPs[ip]) {
      const now = Date.now()
      if (now < lockedIPs[ip]) {
        const mins = Math.ceil((lockedIPs[ip] - now) / 60000)
        return NextResponse.json(
          { error: `Zu viele Versuche. Bitte warten Sie ${mins} Minuten.` },
          { status: 429 }
        )
      } else {
        delete lockedIPs[ip]
        delete loginAttempts[ip]
      }
    }
    
    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 })
    }
    
    // User suchen
    let user = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } })
    let role = 'admin'
    if (!user) {
      user = await prisma.careHome.findUnique({ where: { email: email.toLowerCase() } })
      role = 'careHome'
    }
    
    // Passwort prüfen
    const valid = user && await bcrypt.compare(password, user.passwordHash)
    
    if (!valid) {
      loginAttempts[ip] = (loginAttempts[ip] || 0) + 1
      
      if (loginAttempts[ip] >= MAX_ATTEMPTS) {
        lockedIPs[ip] = Date.now() + LOCKOUT_DURATION
        return NextResponse.json(
          { error: 'Zu viele fehlgeschlagene Versuche. Account für 30 Minuten gesperrt.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: `Ungültige Anmeldedaten. Versuch ${loginAttempts[ip]}/${MAX_ATTEMPTS}` },
        { status: 401 }
      )
    }
    
    // Erfolg - zurücksetzen
    delete loginAttempts[ip]
    delete lockedIPs[ip]
    
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const token = await new SignJWT({ userId: user.id, email, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret)
    
    const response = NextResponse.json({ success: true, user: { email, role } })
    response.cookies.set('session', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 86400, 
      path: '/' 
    })
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
