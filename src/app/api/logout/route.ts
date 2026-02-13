import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    
    // Use NEXTAUTH_URL env var or fallback to request URL
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get('host') || 'localhost:3000'
    const protocol = baseUrl.includes('localhost') ? 'http' : 'https'
    
    // Redirect to login page after logout
    return NextResponse.redirect(new URL(`${protocol}://${baseUrl}/login`))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    )
  }
}