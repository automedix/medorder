// Einfacher In-Memory Rate Limiter für Login-Versuche
// In Production besser Redis verwenden

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  blockedUntil?: number
}

const loginAttempts = new Map<string, RateLimitEntry>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 Minuten
const BLOCK_DURATION_MS = 30 * 60 * 1000 // 30 Minuten Block

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; blocked?: boolean } {
  const now = Date.now()
  const entry = loginAttempts.get(identifier)

  // Prüfen ob geblockt
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, remaining: 0, blocked: true }
  }

  // Block aufheben wenn Zeit abgelaufen
  if (entry?.blockedUntil && now >= entry.blockedUntil) {
    loginAttempts.delete(identifier)
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Keine Einträge vorhanden
  if (!entry) {
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Zeitfenster abgelaufen?
  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(identifier)
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Noch Versuche übrig?
  const remaining = Math.max(0, MAX_ATTEMPTS - entry.attempts)
  return { allowed: remaining > 0, remaining }
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now()
  const entry = loginAttempts.get(identifier)

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    // Neue Serie starten
    loginAttempts.set(identifier, {
      attempts: 1,
      firstAttempt: now
    })
  } else {
    // Serie fortsetzen
    const newAttempts = entry.attempts + 1
    
    if (newAttempts >= MAX_ATTEMPTS) {
      // Blockieren
      loginAttempts.set(identifier, {
        attempts: newAttempts,
        firstAttempt: entry.firstAttempt,
        blockedUntil: now + BLOCK_DURATION_MS
      })
    } else {
      loginAttempts.set(identifier, {
        attempts: newAttempts,
        firstAttempt: entry.firstAttempt
      })
    }
  }
}

export function clearAttempts(identifier: string): void {
  loginAttempts.delete(identifier)
}

// Cleanup alle 10 Minuten
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of loginAttempts.entries()) {
    // Löschen wenn Zeitfenster abgelaufen und nicht mehr geblockt
    if (!entry.blockedUntil && now - entry.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(key)
    }
    // Oder wenn Block abgelaufen
    if (entry.blockedUntil && now >= entry.blockedUntil) {
      loginAttempts.delete(key)
    }
  }
}, 10 * 60 * 1000)
