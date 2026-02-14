'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface Product {
  id: string
  name: string
  description: string | null
  unit: string
}

interface Category {
  id: string
  name: string
  products: Product[]
}

interface CartItem {
  productId: string
  name: string
  unit: string
  quantity: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [patients, setPatients] = useState<Patient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [router])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (!data.session || data.session.role !== 'careHome') {
        router.push('/login')
        return
      }
      
      fetchPatients()
      fetchCategories()
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    const res = await fetch('/api/patients')
    if (res.ok) {
      const data = await res.json()
      setPatients(data)
    }
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data)
    }
  }

  const addToCart = (product: Product, quantity: number) => {
    if (quantity <= 0) return
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        quantity
      }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  const submitOrder = async () => {
    if (!selectedPatient || cart.length === 0) return

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        items: cart,
        notes
      })
    })

    if (res.ok) {
      const data = await res.json()
      setOrderNumber(data.orderNumber)
      setStep(4)
    }
  }

  if (loading) {
    return <div className="p-8">Laden...</div>
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#4477BB'}}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold" style={{color: '#111827'}}>Neue Bestellung</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Abbrechen
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8 flex items-center space-x-4">
          <div className={`px-4 py-2 rounded ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} style={{color: step >= 1 ? 'white' : '#374151'}}>
            1. Patient wählen
          </div>
          <div className={`px-4 py-2 rounded ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} style={{color: step >= 2 ? 'white' : '#374151'}}>
            2. Produkte wählen
          </div>
          <div className={`px-4 py-2 rounded ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} style={{color: step >= 3 ? 'white' : '#374151'}}>
            3. Überprüfen
          </div>
        </div>

        {/* Schritt 1: Patient wählen */}
        {step === 1 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4" style={{color: '#111827'}}>Patient auswählen</h2>
            
            {patients.length === 0 ? (
              <div className="text-center py-8">
                <p className="mb-4" style={{color: '#374151'}}>Noch keine Patienten angelegt</p>
                <Link href="/patients" className="text-blue-600 hover:underline">
                  Zuerst Patienten anlegen →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {patients.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient)
                      setStep(2)
                    }}
                    className={`w-full p-4 text-left border rounded hover:bg-blue-50 ${
                      selectedPatient?.id === patient.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium" style={{color: '#111827'}}>{patient.lastName}, {patient.firstName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schritt 2: Produkte wählen */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {categories.map(category => (
                <div key={category.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-lg mb-3" style={{color: '#111827'}}>{category.name}</h3>
                  <div className="space-y-2">
                    {category.products.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium" style={{color: '#111827'}}>{product.name}</div>
                          {product.description && (
                            <div className="text-sm" style={{color: '#6b7280'}}>{product.description}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            defaultValue="1"
                            className="w-16 p-1 border rounded text-center"
                            style={{color: '#111827'}}
                            id={`qty-${product.id}`}
                          />
                          <span className="text-sm" style={{color: '#6b7280'}}>{product.unit}</span>
                          <button
                            onClick={() => {
                              const input = document.getElementById(`qty-${product.id}`) as HTMLInputElement
                              addToCart(product, parseInt(input.value) || 1)
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-lg shadow h-fit">
              <h3 className="font-semibold mb-3" style={{color: '#111827'}}>Warenkorb</h3>
              {cart.length === 0 ? (
                <p style={{color: '#6b7280'}}>Noch keine Produkte</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {cart.map(item => (
                      <div key={item.productId} className="flex justify-between items-center p-2 bg-blue-100 rounded">
                        <div>
                          <div className="font-medium" style={{color: '#111827'}}>{item.name}</div>
                          <div className="text-sm" style={{color: '#6b7280'}}>{item.quantity} {item.unit}</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Weiter →
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Schritt 3: Überprüfen */}
        {step === 3 && selectedPatient && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4" style={{color: '#111827'}}>Bestellung überprüfen</h2>
            
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <div className="font-medium" style={{color: '#111827'}}>Patient:</div>
              <div style={{color: '#374151'}}>{selectedPatient.lastName}, {selectedPatient.firstName}</div>
            </div>

            <div className="mb-4">
              <div className="font-medium mb-2" style={{color: '#111827'}}>Produkte:</div>
              <div className="space-y-1">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between p-2 border rounded">
                    <span style={{color: '#111827'}}>{item.name}</span>
                    <span style={{color: '#374151'}}>{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1" style={{color: '#111827'}}>Hinweis (optional):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded"
                style={{color: '#111827'}}
                rows={3}
                placeholder="Besondere Hinweise zur Bestellung..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border rounded hover:bg-blue-100: '#4477BB'}}
                style={{color: '#374151'}}
              >
                ← Zurück
              </button>
              <button
                onClick={submitOrder}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Bestellung absenden
              </button>
            </div>
          </div>
        )}

        {/* Schritt 4: Erfolg */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2" style={{color: '#111827'}}>Bestellung erfolgreich!</h2>
            <p className="mb-4" style={{color: '#374151'}}>
              Ihre Bestellung wurde an die Praxis gesendet.
            </p>
            <div className="text-2xl font-mono bg-gray-100 p-4 rounded mb-6" style={{color: '#111827'}}>
              Bestellnummer: {orderNumber}
            </div>
            <div className="space-x-4">
              <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Zum Dashboard
              </Link>
              <button
                onClick={() => {
                  setStep(1)
                  setCart([])
                  setNotes('')
                  setSelectedPatient(null)
                }}
                className="px-4 py-2 border rounded hover:bg-blue-100: '#4477BB'}}
                style={{color: '#374151'}}
              >
                Neue Bestellung
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
