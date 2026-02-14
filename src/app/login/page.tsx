'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Building2, Stethoscope, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'careHome' | 'admin'>('careHome')
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
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Linke Seite - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">MedOrder</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Digitale Bestellung von<br />
            Verbandmaterial
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Einfach, schnell und sicher – Pflegedienste bestellen direkt bei der Arztpraxis.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-blue-100">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">1</div>
            <span>Patient auswählen</span>
          </div>
          <div className="flex items-center gap-3 text-blue-100">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">2</div>
            <span>Produkte hinzufügen</span>
          </div>
          <div className="flex items-center gap-3 text-blue-100">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">3</div>
            <span>Bestellung absenden</span>
          </div>
        </div>

        <div className="text-sm text-blue-200">
          © 2025 MedOrder. Alle Rechte vorbehalten.
        </div>
      </div>

      {/* Rechte Seite - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">MedOrder</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Willkommen zurück
            </h2>
            <p className="text-gray-500 mb-6">
              Melden Sie sich an, um fortzufahren
            </p>

            {/* Rollen-Auswahl */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole('careHome')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === 'careHome'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-sm font-medium">Pflegeheim</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === 'admin'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Stethoscope className="w-6 h-6" />
                <span className="text-sm font-medium">Praxis-Admin</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="name@unternehmen.de"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Anmelden...
                  </>
                  ) : (
                  'Anmelden'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Test-Zugangsdaten:
              </p>
              <div className="mt-2 text-xs text-gray-400 text-center space-y-1">
                <p>Pflegeheim: <span className="font-mono">demo@pflegeheim.de</span> / <span className="font-mono">demo123</span></p>
                <p>Admin: <span className="font-mono">admin@praxis.de</span> / <span className="font-mono">admin123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
