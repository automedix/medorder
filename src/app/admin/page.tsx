import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Tag, DollarSign, Building2, LogOut, Stethoscope, TrendingUp, Archive } from 'lucide-react'

export default async function AdminPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    redirect('/login')
  }

  const adminLinks = [
    {
      href: '/admin/orders',
      icon: Package,
      title: 'Bestellungen',
      description: 'Eingehende Bestellungen verwalten und bearbeiten',
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
      badge: 'Neu'
    },
    {
      href: '/admin/products',
      icon: Tag,
      title: 'Sortiment',
      description: 'Produkte, Kategorien und Verfügbarkeit verwalten',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      href: '/admin/prices',
      icon: DollarSign,
      title: 'Preisliste',
      description: 'PZNs, Anbieter & Preise mit Vergleichsfunktion',
      color: 'bg-violet-500',
      hoverColor: 'hover:bg-violet-600'
    },
    {
      href: '/admin/carehomes',
      icon: Building2,
      title: 'Pflegeheime',
      description: 'Zugänge verwalten und neue Einrichtungen anlegen',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      href: '/admin/archive',
      icon: Archive,
      title: 'Archiv',
      description: 'Archivierte Patienten und deren Bestellhistorie',
      color: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700'
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
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MedOrder</h1>
                <p className="text-xs text-gray-500">Praxis-Admin</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{session.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
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
            Praxis-Administration
          </h2>
          <p className="text-gray-600">
            Verwalten Sie Bestellungen, Produkte und Pflegeheim-Zugänge
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Offene Bestellungen', value: '—', color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Aktive Pflegeheime', value: '—', color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Produkte im Sortiment', value: '—', color: 'text-violet-600', bg: 'bg-violet-100' },
            { label: 'Bestellungen heute', value: '—', color: 'text-orange-600', bg: 'bg-orange-100' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <TrendingUp className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Admin Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {adminLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="group block"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 ${link.color} ${link.hoverColor} rounded-xl flex items-center justify-center transition-colors`}>
                    <link.icon className="w-7 h-7 text-white" />
                  </div>
                  {link.badge && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      {link.badge}
                    </span>
                  )}
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

        {/* Shortcuts */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Schnellzugriff</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/admin/orders" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors">
              <Package className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Bestellungen</span>
            </Link>
            <Link href="/admin/products" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors">
              <Tag className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Produkte</span>
            </Link>
            <Link href="/admin/prices" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors">
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Preise</span>
            </Link>
            <Link href="/admin/carehomes" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors">
              <Building2 className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Pflegeheime</span>
            </Link>
            <Link href="/admin/archive" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 text-center transition-colors">
              <Archive className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Archiv</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
