import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

// Rate Limiting Konfiguration
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 Minuten

// Speichert Login-Versuche im Speicher (für Produktion: Redis empfohlen)
interface AttemptRecord {
  count: number
  firstAttempt: number
  lockedUntil?: number
}

const loginAttempts = new Map<string, AttemptRecord>()

// Cleanup alter Einträge alle 10 Minuten
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of loginAttempts.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      loginAttempts.delete(key)
    }
  }
}, 10 * 60 * 1000)

function getClientIdentifier(request: NextRequest): string {
  // Kombination aus IP und User-Agent für bessere Erkennung
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `${ip}_${userAgent.slice(0, 50)}`
}

function checkRateLimit(identifier: string): { allowed: boolean; remaining?: number; lockoutMinutes?: number } {
  const now = Date.now()
  const record = loginAttempts.get(identifier)
  
  if (!record) {
    return { allowed: true }
  }
  
  // Prüfen ob noch gesperrt
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000)
    return { allowed: false, lockoutMinutes: remainingMinutes }
  }
  
  // Sperre aufheben wenn Zeit abgelaufen
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(identifier)
    return { allowed: true }
  }
  
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count }
}

function recordFailedAttempt(identifier: string): void {
  const now = Date.now()
  const record = loginAttempts.get(identifier)
  
  if (!record) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now
    })
    return
  }
  
  record.count++
  
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION
  }
}

function clearAttempts(identifier: string): void {
  loginAttempts.delete(identifier)
}

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  
  try {
    // Rate Limiting prüfen
    const rateCheck = checkRateLimit(clientId)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Zu viele fehlgeschlagene Versuche.',
          lockoutMinutes: rateCheck.lockoutMinutes 
        },
        { status: 429 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort erforderlich' },
        { status: 400 }
      )
    }

    // Auto-detect: erst Admin, dann CareHome
    let user = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    })
    let role = 'admin'

    if (!user) {
      user = await prisma.careHome.findUnique({
        where: { email: email.toLowerCase() }
      })
      role = 'careHome'
    }

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      recordFailedAttempt(clientId)
      const remainingAttempts = MAX_ATTEMPTS - (loginAttempts.get(clientId)?.count || 0)
      
      return NextResponse.json(
        { 
          error: 'Ungültige Anmeldedaten',
          remainingAttempts: Math.max(0, remainingAttempts)
        },
        { status: 401 }
      )
    }

    // Erfolgreicher Login: Rate Limit zurücksetzen
    clearAttempts(clientId)

    // JWT Token erstellen
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role,
        name: user.name || user.contactPerson || user.email
      }
    })

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
