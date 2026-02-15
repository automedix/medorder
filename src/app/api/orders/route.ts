import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

// HTML Escaping für E-Mail-Inhalte
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  
  if (!session || session.role !== 'careHome') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const careHomeId = session.userId
  
  try {
    const body = await request.json()
    const { patientId, items, notes } = body

    if (!patientId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Patient und Artikel erforderlich' }, { status: 400 })
    }

    // IDOR-Schutz: Prüfen ob Patient zum Pflegeheim gehört
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { careHomeId: true }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient nicht gefunden' }, { status: 404 })
    }

    if (patient.careHomeId !== careHomeId) {
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 })
    }

    // Atomare Bestellnummer mit DB-Transaktion
    const order = await prisma.$transaction(async (tx) => {
      // Heutige Bestellungen zählen
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const count = await tx.order.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })

      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
      const orderNumber = `BM-${dateStr}-${String(count + 1).padStart(3, '0')}`

      // Bestellung erstellen
      return tx.order.create({
        data: {
          careHomeId,
          patientId,
          orderNumber,
          totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
          notes: notes ? String(notes).slice(0, 1000) : null, // Länge limitieren
          items: {
            create: items.slice(0, 50).map((item: any) => ({ // Max 50 Artikel
              productId: String(item.productId).slice(0, 100),
              quantity: Math.max(1, Math.min(9999, parseInt(item.quantity) || 1)),
              productName: String(item.name).slice(0, 255),
              productUnit: String(item.unit).slice(0, 50)
            }))
          }
        },
        include: {
          careHome: true,
          patient: true,
          items: true
        }
      })
    })

    // E-Mail mit escapten Werten
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
        <h2>Neue Bestellung ${escapeHtml(order.orderNumber)}</h2>
        <p><strong>Pflegeheim:</strong> ${escapeHtml(order.careHome.name)}</p>
        <p><strong>Patient:</strong> ${escapeHtml(order.patient.lastName)}, ${escapeHtml(order.patient.firstName)}</p>
        <p><strong>Geburtsdatum:</strong> ${new Date(order.patient.dateOfBirth).toLocaleDateString('de-DE')}</p>
        
        <h3>Bestellte Artikel:</h3>
        <table border="1" cellpadding="8" style="border-collapse: collapse;">
          <tr>
            <th>Artikel</th>
            <th>Menge</th>
          </tr>
          ${order.items.map(item => `
            <tr>
              <td>${escapeHtml(item.productName)}</td>
              <td>${escapeHtml(String(item.quantity))} ${escapeHtml(item.productUnit)}</td>
            </tr>
          `).join('')}
        </table>
        
        ${order.notes ? `<p><strong>Hinweis:</strong> ${escapeHtml(order.notes)}</p>` : ''}
        
        <p>Bestelldatum: ${new Date(order.createdAt).toLocaleString('de-DE')}</p>
      `

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: `Neue Bestellung ${order.orderNumber}`,
        html: emailHtml
      })
    } catch (emailErr) {
      // Nicht blockieren, aber loggen
      console.error('Email delivery failed')
    }

    return NextResponse.json({ orderNumber: order.orderNumber })
  } catch (error) {
    console.error('Order creation failed')
    return NextResponse.json({ error: 'Bestellung konnte nicht erstellt werden' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let where: any = {}
    
    if (session.role === 'careHome') {
      where.careHomeId = session.userId
    }
    
    // Berechne Datum vor 7 Tagen
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    where.OR = [
      { status: 'PENDING' },
      { 
        AND: [
          { status: 'COMPLETED' },
          { completedAt: { gte: oneWeekAgo } }
        ]
      }
    ]

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
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders')
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
