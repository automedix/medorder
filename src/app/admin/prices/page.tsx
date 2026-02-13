'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  unit: string
}

interface ProductPrice {
  id: string
  pzn: string
  supplier: string
  price: number
  packSize: string
  isActive: boolean
  product: {
    name: string
    unit: string
  }
}

export default function PricesPage() {
  const router = useRouter()
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    productId: '',
    pzn: '',
    supplier: '',
    price: '',
    packSize: '',
  })

  useEffect(() => {
    checkAuth()
  }, [router])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (!data.session) {
        router.push('/login')
        return
      }
      
      if (data.session.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      
      fetchPrices()
      fetchProducts()
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/prices')
      if (res.ok) {
        const data = await res.json()
        setPrices(data)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      })

      if (res.ok) {
        setFormData({
          productId: '',
          pzn: '',
          supplier: '',
          price: '',
          packSize: '',
        })
        setShowForm(false)
        fetchPrices()
      }
    } catch (error) {
      console.error('Error creating price:', error)
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            Preisliste verwalten
          </h1>
          <div className="flex gap-4">
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              ← Zurück zum Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Hier können Sie PZNs, Anbieter und Preise für Produkte hinterlegen.
            Bei Bestellungen werden automatisch die 3 günstigsten Anbieter angezeigt.
          </p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Abbrechen' : '+ Preis hinzufügen'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Neuen Preis anlegen</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produkt *
                </label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                >
                  <option value="">Bitte wählen</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id} style={{ color: '#111827' }}>
                      {product.name} ({product.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PZN (Pharmazentralnummer) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pzn}
                  onChange={(e) => setFormData({ ...formData, pzn: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                  placeholder="z.B. 12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anbieter/Lieferant *
                </label>
                <input
                  type="text"
                  required
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                  placeholder="z.B. Apotheke Müller"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preis (EUR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Packungsgröße
                </label>
                <input
                  type="text"
                  value={formData.packSize}
                  onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                  placeholder="z.B. 50 Stück, 10x2 Stück"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produkt</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PZN</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Anbieter</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Packung</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Preis</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {prices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Noch keine Preise hinterlegt.
                  </td>
                </tr>
              ) : (
                prices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{price.product.name}</div>
                      <div className="text-sm text-gray-500">{price.product.unit}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{price.pzn}</td>
                    <td className="px-4 py-3">{price.supplier}</td>
                    <td className="px-4 py-3 text-sm">{price.packSize || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">
                      {formatPrice(price.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded ${
                          price.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {price.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}