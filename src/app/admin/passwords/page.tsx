'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Key, RefreshCw, Shield, Eye, EyeOff } from 'lucide-react'

interface CareHome {
  id: string
  name: string
  email: string
}

export default function PasswordsPage() {
  const router = useRouter()
  const [careHomes, setCareHomes] = useState<CareHome[]>([])
  const [loading, setLoading] = useState(true)
  
  // Masterpasswort Modal
  const [showMasterModal, setShowMasterModal] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [masterError, setMasterError] = useState('')
  
  // Pflegeheim Passwort Reset
  const [selectedCareHome, setSelectedCareHome] = useState<CareHome | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Admin Passwort Ändern
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [adminNewPassword, setAdminNewPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchCareHomes()
  }, [])

  const fetchCareHomes = async () => {
    try {
      const res = await fetch('/api/carehomes')
      if (res.ok) {
        setCareHomes(await res.json())
      }
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const openResetModal = (careHome: CareHome) => {
    setSelectedCareHome(careHome)
    setNewPassword(generatePassword())
    setMasterPassword('')
    setMasterError('')
    setShowMasterModal(true)
  }

  const resetCareHomePassword = async () => {
    if (!selectedCareHome) return
    
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careHomeId: selectedCareHome.id,
          masterPassword,
          newPassword
        })
      })

      if (res.ok) {
        setShowMasterModal(false)
        setSuccessMessage(`Passwort für ${selectedCareHome.name} wurde zurückgesetzt.`)
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        const data = await res.json()
        setMasterError(data.error || 'Fehler beim Zurücksetzen')
      }
    } catch (error) {
      setMasterError('Netzwerkfehler')
    }
  }

  const changeAdminPassword = async () => {
    if (adminNewPassword.length < 6) {
      setMasterError('Passwort muss mindestens 6 Zeichen haben')
      return
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterPassword,
          newPassword: adminNewPassword
        })
      })

      if (res.ok) {
        setShowAdminForm(false)
        setSuccessMessage('Ihr Admin-Passwort wurde geändert.')
        setAdminNewPassword('')
        setMasterPassword('')
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        const data = await res.json()
        setMasterError(data.error || 'Fehler beim Ändern')
      }
    } catch (error) {
      setMasterError('Netzwerkfehler')
    }
  }

  const openAdminForm = () => {
    setShowAdminForm(true)
    setShowMasterModal(true)
    setMasterPassword('')
    setMasterError('')
    setAdminNewPassword('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Zurück</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Passwortverwaltung</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Admin Passwort ändern */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Admin-Passwort</h2>
              <p className="text-sm text-gray-600">Ihr eigenes Passwort ändern</p>
            </div>
          </div>
          <button
            onClick={openAdminForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Key className="w-4 h-4" />
            Passwort ändern
          </button>
        </div>

        {/* Pflegeheim Passwörter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pflegeheim-Passwörter</h2>
                <p className="text-sm text-gray-600">Passwörter für Pflegeheime zurücksetzen</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {careHomes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Keine Pflegeheime vorhanden.
              </div>
            ) : (
              careHomes.map((careHome) => (
                <div key={careHome.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium text-gray-900">{careHome.name}</h3>
                    <p className="text-sm text-gray-600">{careHome.email}</p>
                  </div>
                  <button
                    onClick={() => openResetModal(careHome)}
                    className="flex items-center gap-2 text-violet-600 hover:text-violet-800 font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Zurücksetzen
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hinweis Masterpasswort */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Masterpasswort erforderlich</h3>
              <p className="text-sm text-amber-700 mt-1">
                Für alle Passwort-Änderungen wird das Masterpasswort benötigt. 
                Dieses ist in der .env-Datei konfiguriert (Standard: admin-master-123).
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Masterpasswort Modal */}
      {showMasterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showAdminForm ? 'Admin-Passwort ändern' : `Passwort zurücksetzen: ${selectedCareHome?.name}`}
            </h3>

            {masterError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {masterError}
              </div>
            )}

            {/* Masterpasswort Eingabe */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Masterpasswort *
              </label>
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masterpasswort eingeben"
                autoFocus
              />
            </div>

            {/* Neues Passwort (Admin oder generiert) */}
            {showAdminForm ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neues Admin-Passwort *
                </label>
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mindestens 6 Zeichen"
                  minLength={6}
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neues Passwort (wird automatisch generiert)
                </label>
                <div className="flex gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPassword(generatePassword())}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Neues Passwort generieren
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={showAdminForm ? changeAdminPassword : resetCareHomePassword}
                disabled={!masterPassword || (showAdminForm && !adminNewPassword)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showAdminForm ? 'Passwort ändern' : 'Zurücksetzen'}
              </button>
              <button
                onClick={() => {
                  setShowMasterModal(false)
                  setShowAdminForm(false)
                  setSelectedCareHome(null)
                  setMasterError('')
                  setMasterPassword('')
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}