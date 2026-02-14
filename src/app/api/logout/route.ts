import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    
    // Korrekte Host-Header verwenden für die Weiterleitung
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = headersList.get('x-forwarded-proto') || 'http'
    
    return NextResponse.redirect(new URL('/login', `${protocol}://${host}`))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    )
  }
}