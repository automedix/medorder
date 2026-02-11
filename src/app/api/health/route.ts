import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      error: 'Database connection failed'
    }, { status: 503 })
  }
}
