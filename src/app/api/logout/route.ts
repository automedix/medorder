import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    
    // Sicherer relativer Redirect - keine Host-Header Injection möglich
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('Logout error')
    return NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    )
  }
}
