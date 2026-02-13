import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'careHome') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const careHomeId = session.id
  
  try {
    const body = await request.json()
    const { patientId, items, notes } = body

    if (!patientId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Patient und Artikel erforderlich' }, { status: 400 })
    }

    // Generate order number: BM-YYYYMMDD-XXX
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0))
        }
      }
    })
    const orderNumber = `BM-${dateStr}-${String(count + 1).padStart(3, '0')}`

    // Create order
    const order = await prisma.order.create({
      data: {
        careHomeId,
        patientId,
        orderNumber,
        totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            productName: item.name,
            productUnit: item.unit
          }))
        }
      },
      include: {
        careHome: true,
        patient: true,
        items: true
      }
    })

    // Send email notification
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      })

      const emailHtml = `
        <h2>Neue Bestellung ${order.orderNumber}</h2>
        <p><strong>Pflegeheim:</strong> ${order.careHome.name}</p>
        <p><strong>Patient:</strong> ${order.patient.lastName}, ${order.patient.firstName}</p>
        <p><strong>Geburtsdatum:</strong> ${new Date(order.patient.dateOfBirth).toLocaleDateString('de-DE')}</p>
        
        <h3>Bestellte Artikel:</h3>
        <table border="1" cellpadding="8" style="border-collapse: collapse;">
          <tr>
            <th>Artikel</th>
            <th>Menge</th>
          </tr>
          ${order.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity} ${item.productUnit}</td>
            </tr>
          `).join('')}
        </table>
        
        ${notes ? `<p><strong>Hinweis:</strong> ${notes}</p>` : ''}
        
        <p>Bestelldatum: ${new Date(order.createdAt).toLocaleString('de-DE')}</p>
      `

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: `Neue Bestellung ${order.orderNumber}`,
        html: emailHtml
      })
    } catch (emailErr) {
      console.error('Email failed:', emailErr)
      // Don't fail the order if email fails
    }

    return NextResponse.json({ orderNumber: order.orderNumber })
  } catch (error) {
    console.error('Order creation failed:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let where: any = {}
    
    // Pflegeheim sieht nur eigene Bestellungen
    if (session.role === 'careHome') {
      where.careHomeId = session.id
    }
    // Admin sieht alle (oder kann filtern)

    const orders = await prisma.order.findMany({
      where,
      include: {
        careHome: {
          select: {
            name: true,
            email: true,
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          }
        },
        items: {
          select: {
            productName: true,
            productUnit: true,
            quantity: true,
            productId: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}