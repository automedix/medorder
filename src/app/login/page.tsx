'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('careHome')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Anmeldung fehlgeschlagen')
        setLoading(false)
        return
      }

      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Verbindungsfehler')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{backgroundColor: '#4477BB'}}>
      {/* Logo */}
      <div className="mb-8">
        <Image 
          src="/logo.png" 
          alt="MedOrder Logo" 
          width={200} 
          height={80}
          onError={(e) => {
            // Fallback wenn Logo nicht gefunden
            e.currentTarget.style.display = 'none'
          }}
        />
        {/* Fallback Text wenn kein Logo */}
        <div className="text-white text-3xl font-bold text-center">
          MedOrder
        </div>
      </div>

      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6" style={{color: '#111827'}}>
          Verbandmaterial-Bestellung
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1" style={{color: '#111827'}}>
              Anmelden als
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
              style={{ color: '#111827', fontSize: '16px' }}
            >
              <option value="careHome">Pflegeheim</option>
              <option value="admin">Praxis-Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1" style={{color: '#111827'}}>
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="email@beispiel.de"
              style={{ color: '#111827', fontSize: '16px' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1" style={{color: '#111827'}}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Ihr Passwort"
              style={{ color: '#111827', fontSize: '16px' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
      </div>

    </div>
  )
}