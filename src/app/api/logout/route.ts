import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    
    // Sicherer Redirect zur Login-Seite
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Logout error')
    return NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    )
  }
}
