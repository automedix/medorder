import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createToken, setSessionCookie } from '@/lib/auth'
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Anmeldedaten unvollständig' },
        { status: 400 }
      )
    }

    // Rate Limiting basierend auf E-Mail
    const rateLimit = checkRateLimit(email.toLowerCase())
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Zu viele fehlgeschlagene Versuche. Bitte warten Sie 30 Minuten.' },
        { status: 429 }
      )
    }

    const user = await authenticateUser(email, password, role)

    if (!user) {
      recordFailedAttempt(email.toLowerCase())
      // Generische Fehlermeldung (keine Username Enumeration)
      return NextResponse.json(
        { error: 'Anmeldedaten ungültig' },
        { status: 401 }
      )
    }

    // Erfolgreicher Login - Attempts zurücksetzen
    clearAttempts(email.toLowerCase())

    const token = await createToken(user)
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error') // Keine sensiblen Daten loggen
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
