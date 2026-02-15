import { prisma } from './prisma'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 Minuten
const BLOCK_DURATION_MS = 30 * 60 * 1000 // 30 Minuten

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; blocked?: boolean }> {
  const now = new Date()
  
  // Alte Einträge löschen (älter als 1 Stunde)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  await prisma.loginAttempt.deleteMany({
    where: {
      updatedAt: { lt: oneHourAgo },
      blockedUntil: null
    }
  })

  // Eintrag für diesen Identifier finden
  const entry = await prisma.loginAttempt.findFirst({
    where: { identifier: identifier.toLowerCase() }
  })

  if (!entry) {
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Prüfen ob geblockt
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return { allowed: false, remaining: 0, blocked: true }
  }

  // Block aufheben wenn Zeit abgelaufen
  if (entry.blockedUntil && entry.blockedUntil <= now) {
    await prisma.loginAttempt.delete({ where: { id: entry.id } })
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Zeitfenster abgelaufen?
  const windowExpired = now.getTime() - entry.firstAttempt.getTime() > WINDOW_MS
  if (windowExpired) {
    await prisma.loginAttempt.delete({ where: { id: entry.id } })
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }

  // Noch Versuche übrig?
  const remaining = Math.max(0, MAX_ATTEMPTS - entry.attempts)
  return { allowed: remaining > 0, remaining }
}

export async function recordFailedAttempt(identifier: string): Promise<void> {
  const now = new Date()
  const identifierLower = identifier.toLowerCase()
  
  const entry = await prisma.loginAttempt.findFirst({
    where: { identifier: identifierLower }
  })

  if (!entry) {
    // Neue Serie starten
    await prisma.loginAttempt.create({
      data: {
        identifier: identifierLower,
        attempts: 1,
        firstAttempt: now
      }
    })
  } else {
    // Zeitfenster abgelaufen?
    const windowExpired = now.getTime() - entry.firstAttempt.getTime() > WINDOW_MS
    
    if (windowExpired) {
      // Reset und neu starten
      await prisma.loginAttempt.update({
        where: { id: entry.id },
        data: {
          attempts: 1,
          firstAttempt: now,
          blockedUntil: null,
          updatedAt: now
        }
      })
    } else {
      // Serie fortsetzen
      const newAttempts = entry.attempts + 1
      
      if (newAttempts >= MAX_ATTEMPTS) {
        // Blockieren
        const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS)
        await prisma.loginAttempt.update({
          where: { id: entry.id },
          data: {
            attempts: newAttempts,
            blockedUntil: blockedUntil,
            updatedAt: now
          }
        })
      } else {
        await prisma.loginAttempt.update({
          where: { id: entry.id },
          data: {
            attempts: newAttempts,
            updatedAt: now
          }
        })
      }
    }
  }
}

export async function clearAttempts(identifier: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: { identifier: identifier.toLowerCase() }
  })
}
