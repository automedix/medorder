'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, ClipboardList, Users, LogOut, Building2, Shield, AlertCircle, Lock } from 'lucide-react'

interface Session {
  name: string
  email: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  // Prüfen ob Popup angezeigt werden soll (nur nach frischem Login)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldShow = sessionStorage.getItem('showPrivacyNotice') === 'true'
      if (shouldShow) {
        setShowPrivacyModal(true)
        // Flag sofort löschen, damit es nur einmal angezeigt wird
        sessionStorage.removeItem('showPrivacyNotice')
      }
    }
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (!data.session || data.session.role !== 'careHome') {
        router.push('/login')
        return
      }
      
      setSession(data.session)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handlePrivacyConfirm = () => {
    if (privacyConfirmed) {
      setShowPrivacyModal(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-gray-600">Laden...</div>
      </div>
    )
  }

  const quickLinks = [
    {
      href: '/order/new',
      icon: ShoppingCart,
      title: 'Neue Bestellung',
      description: 'Verbandmaterial für Patienten bestellen',
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600'
    },
    {
      href: '/orders',
      icon: ClipboardList,
      title: 'Meine Bestellungen',
      description: 'Bestellhistorie und Status einsehen',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      href: '/patients',
      icon: Users,
      title: 'Patienten',
      description: 'Patienten verwalten und anlegen',
      color: 'bg-violet-500',
      hoverColor: 'hover:bg-violet-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Datenschutzhinweis</h2>
                  <p className="text-blue-100 text-sm">Wichtige Information vor dem Start</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Gesundheitsdaten sind sensibel</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Sie haben Zugriff auf personenbezogene Gesundheitsdaten Ihrer Patienten. 
                      Diese Daten unterliegen dem besonderen Schutz nach DSGVO und sind streng vertraulich.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Schützen Sie Ihre Zugangsdaten</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Ihr Passwort darf niemals an Dritte weitergegeben werden. Bewahren Sie es sicher auf 
                      undMelden Sie verdächtige Aktivitäten sofort der Praxis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Bei Verdacht: Sofort melden</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Falls Sie den Verdacht haben, dass Unberechtigte Zugang erhalten haben könnten 
                      oder Ihre Zugangsdaten kompromittiert wurden, informieren Sie die Praxis umgehend.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacyConfirmed}
                    onChange={(e) => setPrivacyConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    Ich habe die Datenschutzhinweise gelesen und verstanden. 
                    Ich verpflichte mich, Gesundheitsdaten vertraulich zu behandeln 
                    und bei Verdacht auf Datenmissbrauch umgehend zu melden.
                  </span>
                </label>
              </div>

              {/* Button */}
              <button
                onClick={handlePrivacyConfirm}
                disabled={!privacyConfirmed}
                className={`mt-6 w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  privacyConfirmed
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Dashboard öffnen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MedOrder</h1>
                <p className="text-xs text-gray-500">Pflegeheim Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{session.name}</p>
                <p className="text-xs text-gray-500">{session.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Willkommen zurück, {session.name}
          </h2>
          <p className="text-gray-600">
            Was möchten Sie heute tun?
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="group block"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <div className={`w-14 h-14 ${link.color} ${link.hoverColor} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
                  <link.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {link.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">?</span>
            So funktioniert die Bestellung
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', text: 'Patient auswählen oder anlegen' },
              { step: '2', text: 'Verbandmaterial aus dem Sortiment wählen' },
              { step: '3', text: 'Bestellung an die Praxis senden' },
              { step: '4', text: 'Bestätigung mit Bestellnummer erhalten' }
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <p className="text-sm text-blue-50">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-2 gap-6">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <h4 className="font-semibold text-amber-800 mb-2">💡 Tipp</h4>
            <p className="text-sm text-amber-700">
              Legen Sie Patienten im Voraus an, um beim Bestellen Zeit zu sparen.
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-5">
            <h4 className="font-semibold text-green-800 mb-2">✓ Bestellstatus</h4>
            <p className="text-sm text-green-700">
              Unter &quot;Meine Bestellungen&quot; sehen Sie jederzeit den Status Ihrer Aufträge.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
