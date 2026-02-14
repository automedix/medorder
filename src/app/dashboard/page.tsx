import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, ClipboardList, Users, LogOut, Building2 } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'careHome') {
    redirect('/login')
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
              <form action="/api/logout" method="POST">
                <button 
                  type="submit" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Abmelden</span>
                </button>
              </form>
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
