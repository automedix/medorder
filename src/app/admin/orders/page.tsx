'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PriceSuggestion {
  id: string
  pzn: string
  supplier: string
  price: number
  packSize: string
}

interface OrderItem {
  productName: string
  quantity: number
  productUnit: string
  productId: string
  cheapestPrices?: PriceSuggestion[]
}

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'COMPLETED'
  createdAt: string
  totalItems: number
  notes: string | null
  careHome: {
    name: string
    email: string
  }
  patient: {
    firstName: string
    lastName: string
    dateOfBirth: string
  }
  items: OrderItem[]
  expanded?: boolean
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>({})

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (!data.session || data.session.role !== 'admin') {
        router.push('/login')
        return
      }
      
      setSession(data.session)
      fetchOrders()
      setLoading(false)
    } catch {
      router.push('/login')
    }
  }

  const fetchOrders = async () => {
    const res = await fetch('/api/orders')
    if (res.ok) {
      const data = await res.json()
      setOrders(data.map((o: Order) => ({ ...o, expanded: false })))
    }
  }

  const fetchCheapestPrices = async (orderId: string, productId: string) => {
    if (!productId || loadingPrices[`${orderId}-${productId}`]) return
    
    setLoadingPrices(prev => ({ ...prev, [`${orderId}-${productId}`]: true }))
    
    try {
      const res = await fetch(`/api/products/${productId}/cheapest`)
      if (res.ok) {
        const prices = await res.json()
        setOrders(prevOrders => 
          prevOrders.map(order => {
            if (order.id !== orderId) return order
            return {
              ...order,
              items: order.items.map(item => 
                item.productId === productId 
                  ? { ...item, cheapestPrices: prices }
                  : item
              )
            }
          })
        )
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    } finally {
      setLoadingPrices(prev => ({ ...prev, [`${orderId}-${productId}`]: false }))
    }
  }

  const toggleExpand = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    if (!order.expanded) {
      order.items.forEach(item => {
        if (!item.cheapestPrices) {
          fetchCheapestPrices(orderId, item.productId)
        }
      })
    }

    setOrders(prevOrders =>
      prevOrders.map(o => 
        o.id === orderId ? { ...o, expanded: !o.expanded } : o
      )
    )
  }

  const markAsCompleted = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}/complete`, {
      method: 'POST'
    })
    if (res.ok) {
      fetchOrders()
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return order.status === 'PENDING'
    if (filter === 'completed') return order.status === 'COMPLETED'
    return true
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  if (loading) {
    return <div className="p-8">Laden...</div>
  }

  return (
    <div className="min-h-screen style={{backgroundColor: '#4477BB'}}">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-black">Bestellungen verwalten</h1>
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Zurück zum Admin
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            Alle ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-white'}`}
          >
            Offen ({orders.filter(o => o.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white'}`}
          >
            Erledigt ({orders.filter(o => o.status === 'COMPLETED').length})
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>💡 Tipp:</strong> Klicken Sie auf eine Bestellung, um die günstigsten Anbieter mit PZN-Nummern anzuzeigen. 
            Damit können Sie die Bestellung schnell in ein Rezept umwandeln.
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              className={`bg-white rounded-lg shadow overflow-hidden ${order.status === 'PENDING' ? 'border-l-4 border-orange-500' : 'border-l-4 border-green-500'}`}
            >
              {/* Header - Always visible */}
              <div 
                className="p-6 cursor-pointer hover:style={{backgroundColor: '#4477BB'}} transition"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-mono font-bold">{order.orderNumber}</span>
                      {order.status === 'PENDING' ? (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">Offen</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Erledigt</span>
                      )}
                    </div>
                    <div className="text-sm text-black/60 mt-1">
                      {new Date(order.createdAt).toLocaleString('de-DE')} • {order.careHome.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsCompleted(order.id)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Als erledigt markieren
                      </button>
                    )}
                    <span className="text-gray-400">
                      {order.expanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 p-3 style={{backgroundColor: '#4477BB'}} rounded">
                  <div>
                    <div className="text-sm text-black/60">Patient</div>
                    <div className="font-medium">{order.patient.lastName}, {order.patient.firstName}</div>
                    <div className="text-sm text-black/60">
                      {new Date(order.patient.dateOfBirth).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-black/60">Pflegeheim</div>
                    <div className="font-medium">{order.careHome.name}</div>
                    <div className="text-sm text-black/60">{order.careHome.email}</div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {order.expanded && (
                <div className="border-t border-gray-200 p-6 style={{backgroundColor: '#4477BB'}}">
                  <div className="mb-2">
                    <div className="text-sm text-black/60 mb-3 font-semibold">Bestellte Artikel mit Preisvorschlägen:</div>
                    <div className="space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow-sm overflow-hidden">
                          {/* Item Header */}
                          <div className="p-3 bg-gray-100 flex justify-between items-center">
                            <span className="font-medium">{item.productName}</span>
                            <span className="font-semibold text-blue-700">{item.quantity} {item.productUnit}</span>
                          </div>
                          
                          {/* Price Suggestions */}
                          <div className="p-4">
                            {loadingPrices[`${order.id}-${item.productId}`] ? (
                              <div className="text-black/60 text-sm">Lade Preisvorschläge...</div>
                            ) : item.cheapestPrices && item.cheapestPrices.length > 0 ? (
                              <div>
                                <div className="text-xs text-black/60 mb-2">Günstigste Anbieter für Rezept:</div>
                                <div className="grid gap-2">
                                  {item.cheapestPrices.map((price, pidx) => (
                                    <div 
                                      key={price.id} 
                                      className={`p-3 rounded border flex justify-between items-center ${
                                        pidx === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-4">
                                        {pidx === 0 && (
                                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Bester Preis</span>
                                        )}
                                        <div>
                                          <div className="font-mono text-sm text-black/70">PZN: {price.pzn}</div>
                                          <div className="font-medium">{price.supplier}</div>
                                          {price.packSize && (
                                            <div className="text-xs text-black/60">{price.packSize}</div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className={`font-bold text-lg ${pidx === 0 ? 'text-green-700' : 'text-black/80'}`}>
                                          {formatPrice(price.price)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-black/60 text-sm italic">
                                Keine Preisvorschläge für dieses Produkt hinterlegt.
                                <Link href="/admin/prices" className="text-blue-600 hover:underline ml-2">
                                  Preis hinzufügen →
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <div className="text-sm text-yellow-800">
                        <strong>Hinweis:</strong> {order.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-black/60">
              Keine Bestellungen gefunden
            </div>
          )}
        </div>
      </main>
    </div>
  )
}