import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Sicherheitskritisch: JWT Secret MUSS aus Umgebungsvariable kommen
const secretKey = process.env.NEXTAUTH_SECRET
if (!secretKey) {
  throw new Error('NEXTAUTH_SECRET ist nicht gesetzt. Die Anwendung kann nicht starten.')
}

const JWT_SECRET = new TextEncoder().encode(secretKey)

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: 'admin' | 'careHome'
  iat: number
  exp: number
}

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // Kürzere Sessions für bessere Sicherheit
    .sign(JWT_SECRET)
  
  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) return null
  
  return verifyToken(token)
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production'
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: isProduction, // Nur in Production secure
    sameSite: 'strict',   // CSRF-Schutz
    maxAge: 8 * 60 * 60,  // 8 Stunden statt 30 Tage
    path: '/'
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function authenticateUser(
  email: string, 
  password: string, 
  role: 'admin' | 'careHome'
) {
  if (role === 'admin') {
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) return null
    
    const isValid = await bcrypt.compare(password, admin.passwordHash)
    if (!isValid) return null
    
    return {
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin' as const
    }
  } else {
    const careHome = await prisma.careHome.findUnique({ where: { email } })
    if (!careHome || !careHome.isActive) return null
    
    const isValid = await bcrypt.compare(password, careHome.passwordHash)
    if (!isValid) return null
    
    return {
      userId: careHome.id,
      email: careHome.email,
      name: careHome.name,
      role: 'careHome' as const
    }
  }
}
