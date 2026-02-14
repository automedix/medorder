'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit2, Trash2, Package } from 'lucide-react'

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
  const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null)
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
      
      if (!data.session || data.session.role !== 'admin') {
        router.push('/login')
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
        setPrices(data.filter((p: ProductPrice) => p.isActive))
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
        setProducts(data.filter((p: Product) => p.isActive))
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
          price: parseFloat(formData.price)
        })
      })
      
      if (res.ok) {
        setFormData({ productId: '', pzn: '', supplier: '', price: '', packSize: '' })
        setShowForm(false)
        fetchPrices()
      }
    } catch (error) {
      console.error('Error creating price:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrice) return
    
    try {
      const res = await fetch(`/api/prices/${editingPrice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })
      
      if (res.ok) {
        resetForm()
        fetchPrices()
      }
    } catch (error) {
      console.error('Error updating price:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Preis wirklich löschen?')) return
    
    try {
      const res = await fetch(`/api/prices/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchPrices()
      }
    } catch (error) {
      console.error('Error deleting price:', error)
    }
  }

  const startEdit = (price: ProductPrice) => {
    setEditingPrice(price)
    setFormData({
      productId: price.product.name,
      pzn: price.pzn,
      supplier: price.supplier,
      price: price.price.toString(),
      packSize: price.packSize,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({ productId: '', pzn: '', supplier: '', price: '', packSize: '' })
    setShowForm(false)
    setEditingPrice(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Zurück</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Preisliste</h1>
            </div>
            <button
              onClick={() => showForm ? resetForm() : setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {showForm ? 'Abbrechen' : <><Plus className="w-5 h-5" /> Preis hinzufügen</>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPrice ? 'Preis bearbeiten' : 'Neuen Preis anlegen'}
            </h2>
            <form onSubmit={editingPrice ? handleUpdate : handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingPrice && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produkt *</label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Bitte wählen</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PZN *</label>
                <input
                  type="text"
                  required
                  value={formData.pzn}
                  onChange={(e) => setFormData({ ...formData, pzn: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. 12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anbieter *</label>
                <input
                  type="text"
                  required
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. Apotheke Müller"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preis (EUR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Packungsgröße</label>
                <input
                  type="text"
                  value={formData.packSize}
                  onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. 50 Stück"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button 
                  type="submit" 
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  {editingPrice ? 'Aktualisieren' : 'Speichern'}
                </button>
                {editingPrice && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Produkt</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">PZN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Anbieter</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Packung</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Preis</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Noch keine Preise hinterlegt.</p>
                      <p className="text-sm mt-1">Fügen Sie Ihren ersten Preis hinzu.</p>
                    </td>
                  </tr>
                ) : (
                  prices.map((price) => (
                    <tr key={price.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{price.product.name}</div>
                        <div className="text-sm text-gray-500">{price.product.unit}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-900">{price.pzn}</td>
                      <td className="px-4 py-3 text-gray-900">{price.supplier}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{price.packSize || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-700">{formatPrice(price.price)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => startEdit(price)} 
                          className="text-blue-600 hover:text-blue-800 text-sm mr-3 inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Bearbeiten
                        </button>
                        <button 
                          onClick={() => handleDelete(price.id)} 
                          className="text-red-600 hover:text-red-800 text-sm inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}