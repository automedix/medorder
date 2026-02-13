'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CareHome {
  id: string
  name: string
  email: string
  contactPerson: string
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
}

export default function CareHomesClient() {
  const router = useRouter()
  const [careHomes, setCareHomes] = useState<CareHome[]>([])
  const [loading, setLoading] = useState(true)
  
  const [newCareHome, setNewCareHome] = useState({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    address: ''
  })
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCareHomes()
  }, [])

  const fetchCareHomes = async () => {
    try {
      const res = await fetch('/api/carehomes')
      if (res.ok) {
        setCareHomes(await res.json())
      } else if (res.status === 401) {
        setError('Session abgelaufen. Bitte neu anmelden.')
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleCreateCareHome = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGeneratedPassword('')
    const password = generatePassword()
    
    try {
      const res = await fetch('/api/carehomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCareHome,
          password
        })
      })
      
      if (res.ok) {
        setGeneratedPassword(password)
        setNewCareHome({
          name: '',
          email: '',
          contactPerson: '',
          phone: '',
          address: ''
        })
        fetchCareHomes()
        alert(`Pflegeheim angelegt!\n\nE-Mail: ${newCareHome.email}\nPasswort: ${password}\n\nBitte notieren und sicher übermitteln!`)
      } else if (res.status === 401) {
        setError('Nicht autorisiert. Bitte erneut anmelden.')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Anlegen')
      }
    } catch (error) {
      console.error('Fehler:', error)
      setError('Verbindungsfehler')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/carehomes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      if (res.ok) {
        fetchCareHomes()
      } else if (res.status === 401) {
        setError('Session abgelaufen. Bitte neu anmelden.')
      }
    } catch (error) {
      console.error('Fehler:', error)
    }
  }

  if (loading) return <div className="p-8">Laden...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Zugänge verwalten (Pflegeheime)</h1>
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
        
        {/* Neues Pflegeheim Formular */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Neues Pflegeheim anlegen</h2>
          
          <form onSubmit={handleCreateCareHome} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name des Pflegeheims *"
              value={newCareHome.name}
              onChange={(e) => setNewCareHome({...newCareHome, name: e.target.value})}
              className="border rounded-lg px-4 py-2 text-black bg-white"
              style={{ color: '#111827' }}
              required
            />
            <input
              type="email"
              placeholder="E-Mail Adresse *"
              value={newCareHome.email}
              onChange={(e) => setNewCareHome({...newCareHome, email: e.target.value})}
              className="border rounded-lg px-4 py-2 text-black bg-white"
              style={{ color: '#111827' }}
              required
            />
            <input
              type="text"
              placeholder="Ansprechpartner *"
              value={newCareHome.contactPerson}
              onChange={(e) => setNewCareHome({...newCareHome, contactPerson: e.target.value})}
              className="border rounded-lg px-4 py-2 text-black bg-white"
              style={{ color: '#111827' }}
              required
            />
            <input
              type="tel"
              placeholder="Telefon"
              value={newCareHome.phone}
              onChange={(e) => setNewCareHome({...newCareHome, phone: e.target.value})}
              className="border rounded-lg px-4 py-2 text-black bg-white"
              style={{ color: '#111827' }}
            />
            <input
              type="text"
              placeholder="Adresse"
              value={newCareHome.address}
              onChange={(e) => setNewCareHome({...newCareHome, address: e.target.value})}
              className="border rounded-lg px-4 py-2 text-black bg-white md:col-span-2"
              style={{ color: '#111827' }}
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700"
              >
                Pflegeheim anlegen & Passwort generieren
              </button>
            </div>
          </form>
          
          {generatedPassword && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-400 rounded-lg">
              <p className="font-semibold text-yellow-800">Wichtig: Das temporäre Passwort wurde generiert!</p>
              <p className="text-yellow-700 mt-1">Passwort: <strong>{generatedPassword}</strong></p>
            </div>
          )}
        </div>

        {/* Pflegeheime Liste */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-Mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ansprechpartner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {careHomes.map((careHome) => (
                <tr key={careHome.id}>
                  <td className="px-6 py-4 font-medium">{careHome.name}</td>
                  <td className="px-6 py-4">{careHome.email}</td>
                  <td className="px-6 py-4">{careHome.contactPerson}</td>
                  <td className="px-6 py-4">{careHome.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      careHome.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {careHome.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(careHome.id, careHome.isActive)}
                      className={`text-sm ${
                        careHome.isActive 
                          ? 'text-red-600 hover:text-red-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {careHome.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {careHomes.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Noch keine Pflegeheime angelegt.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
