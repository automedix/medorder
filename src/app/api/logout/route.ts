import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    
    // Relative Weiterleitung - Next.js löst automatisch auf
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    )
  }
}