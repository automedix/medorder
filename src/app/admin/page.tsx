import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen style={{backgroundColor: '#4477BB'}}">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold" style={{color: '#111827'}}>
            MedOrder - Praxis-Admin
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{color: '#374151'}}>
              {session.name}
            </div>
            <form action="/api/logout" method="POST">
              <button type="submit" className="text-sm text-red-600 hover:text-red-800">
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bestellungen verwalten */}
          <Link href="/admin/orders" className="block h-full">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition h-full flex flex-col">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-lg font-semibold mb-2" style={{color: '#111827'}}>Bestellungen</h2>
              <p className="flex-grow" style={{color: '#374151'}}>Eingehende Bestellungen verwalten</p>
            </div>
          </Link>

          {/* Sortiment */}
          <Link href="/admin/products" className="block h-full">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition h-full flex flex-col">
              <div className="text-4xl mb-4">🏷️</div>
              <h2 className="text-lg font-semibold mb-2" style={{color: '#111827'}}>Sortiment</h2>
              <p className="flex-grow" style={{color: '#374151'}}>Produkte und Kategorien pflegen</p>
            </div>
          </Link>

          {/* Preisliste */}
          <Link href="/admin/prices" className="block h-full">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition h-full flex flex-col">
              <div className="text-4xl mb-4">💰</div>
              <h2 className="text-lg font-semibold mb-2" style={{color: '#111827'}}>Preisliste</h2>
              <p className="flex-grow" style={{color: '#374151'}}>PZNs, Anbieter & Preise verwalten</p>
            </div>
          </Link>

          {/* Pflegeheime */}
          <Link href="/admin/carehomes" className="block h-full">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition h-full flex flex-col">
              <div className="text-4xl mb-4">🏥</div>
              <h2 className="text-lg font-semibold mb-2" style={{color: '#111827'}}>Pflegeheime</h2>
              <p className="flex-grow" style={{color: '#374151'}}>Zugänge verwalten</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}