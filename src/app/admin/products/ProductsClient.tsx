'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description: string | null
  articleNumber: string | null
  unit: string
  category: Category
  isActive: boolean
}

export default function ProductsClient() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')
  const [error, setError] = useState('')
  
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    articleNumber: '',
    unit: 'Stück',
    categoryId: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products')
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (prodRes.ok) {
        const allProducts = await prodRes.json()
        // Filter nur aktive Produkte anzeigen
        setProducts(allProducts.filter((p: Product) => p.isActive))
      }
    } catch (err) {
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })
      if (res.ok) {
        setNewCategory({ name: '', description: '' })
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Anlegen')
      }
    } catch (err) {
      setError('Verbindungsfehler')
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!newProduct.name || !newProduct.categoryId) {
      setError('Bitte Produktname und Kategorie auswählen')
      return
    }
    
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      })
      if (res.ok) {
        setNewProduct({ name: '', description: '', articleNumber: '', unit: 'Stück', categoryId: '' })
        fetchData()
        alert('Produkt erfolgreich angelegt!')
      } else if (res.status === 401) {
        setError('Nicht autorisiert. Bitte erneut anmelden.')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Anlegen des Produkts')
      }
    } catch (err) {
      setError('Verbindungsfehler')
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Sind Sie sicher, dass Sie "${productName}" löschen möchten?`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchData()
        alert('Produkt erfolgreich gelöscht!')
      } else if (res.status === 401) {
        setError('Nicht autorisiert. Bitte erneut anmelden.')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Löschen')
      }
    } catch (err) {
      setError('Verbindungsfehler')
    }
  }

  if (loading) return <div className="p-8">Laden...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Produkte & Kategorien</h1>
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Zurück zum Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Produkte
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Kategorien
          </button>
        </div>

        {activeTab === 'categories' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Neue Kategorie</h2>
              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-gray-900 bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Beschreibung"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-gray-900 bg-white"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
                >
                  Kategorie anlegen
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beschreibung</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                      <td className="px-6 py-4 text-gray-600">{category.description || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Noch keine Kategorien vorhanden.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Neues Produkt</h2>
              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Produktname"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-gray-900 bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Artikelnummer"
                  value={newProduct.articleNumber}
                  onChange={(e) => setNewProduct({...newProduct, articleNumber: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-gray-900 bg-white"
                />
                <select
                  value={newProduct.categoryId}
                  onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-gray-900 bg-white"
                  required
                >
                  <option value="">Kategorie wählen</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Einheit (z.B. Stück, Packung)"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-gray-900 bg-white"
                />
                <input
                  type="text"
                  placeholder="Beschreibung"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-gray-900 bg-white"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
                >
                  Produkt anlegen
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artikelnr.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Einheit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-gray-600">{product.articleNumber || '-'}</td>
                      <td className="px-6 py-4 text-gray-900">{product.category?.name || '-'}</td>
                      <td className="px-6 py-4 text-gray-900">{product.unit}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Noch keine Produkte vorhanden.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
