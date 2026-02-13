'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OrderItem {
  productName: string
  productUnit: string
  quantity: number
}

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'COMPLETED'
  createdAt: string
  totalItems: number
  notes: string | null
  patient: {
    firstName: string
    lastName: string
    dateOfBirth: string
  }
  items: OrderItem[]
}

export default function MyOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else if (res.status === 401) {
        router.push('/login')
      } else {
        setError('Fehler beim Laden der Bestellungen')
      }
    } catch (err) {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return order.status === 'PENDING'
    if (filter === 'completed') return order.status === 'COMPLETED'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold" style={{color: '#111827'}}>Meine Bestellungen</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12" style={{color: '#374151'}}>Laden...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold" style={{color: '#111827'}}>Meine Bestellungen</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Zurück zum Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            <span style={{color: filter === 'all' ? 'white' : '#374151'}}>Alle ({orders.length})</span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-white'}`}
          >
            <span style={{color: filter === 'pending' ? 'white' : '#374151'}}>Offen ({orders.filter(o => o.status === 'PENDING').length})</span>
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white'}`}
          >
            <span style={{color: filter === 'completed' ? 'white' : '#374151'}}>Erledigt ({orders.filter(o => o.status === 'COMPLETED').length})</span>
          </button>
        </div>

        {/* Bestellungen Liste */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold mb-2" style={{color: '#111827'}}>Noch keine Bestellungen</h2>
            <p className="mb-4" style={{color: '#374151'}}>
              Sie haben noch keine Bestellungen aufgegeben.
            </p>
            <Link 
              href="/order/new" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Neue Bestellung aufgeben
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div 
                key={order.id} 
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  order.status === 'PENDING' 
                    ? 'border-l-4 border-orange-500' 
                    : 'border-l-4 border-green-500'
                }`}
              >
                {/* Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-mono font-bold" style={{color: '#111827'}}>{order.orderNumber}</span>
                        {order.status === 'PENDING' ? (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                            Offen
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Erledigt
                          </span>
                        )}
                      </div>
                      <div className="text-sm mt-1" style={{color: '#6b7280'}}>
                        {new Date(order.createdAt).toLocaleString('de-DE')}
                      </div>
                    </div>
                    <span style={{color: '#9ca3af'}}>
                      {expandedOrder === order.id ? '▼' : '▶'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm" style={{color: '#6b7280'}}>Patient</div>
                      <div className="font-medium" style={{color: '#111827'}}>
                        {order.patient.lastName}, {order.patient.firstName}
                      </div>
                      <div className="text-sm" style={{color: '#6b7280'}}>
                        {new Date(order.patient.dateOfBirth).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm" style={{color: '#6b7280'}}>Artikel</div>
                      <div className="font-medium" style={{color: '#111827'}}>{order.totalItems} Positionen</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <h3 className="font-semibold mb-3" style={{color: '#111827'}}>Bestellte Artikel:</h3>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex justify-between p-3 bg-white rounded shadow-sm"
                        >
                          <span className="font-medium" style={{color: '#111827'}}>{item.productName}</span>
                          <span style={{color: '#374151'}}>
                            {item.quantity} {item.productUnit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <div className="text-sm" style={{color: '#854d0e'}}>
                          <strong>Hinweis:</strong> {order.notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Neue Bestellung Button */}
        <div className="mt-8 text-center">
          <Link 
            href="/order/new" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Neue Bestellung aufgeben
          </Link>
        </div>
      </main>
    </div>
  )
}