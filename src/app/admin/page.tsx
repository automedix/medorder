import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import LogoutButton from '@/components/LogoutButton'

export default async function AdminPage() {
  const session = await getServerSession(authOptions as any)
  
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">MedOrder - Praxis-Admin</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {(session.user as any).name}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bestellungen verwalten */}
          <Link href="/admin/orders" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-lg font-semibold mb-2">Bestellungen</h2>
              <p className="text-gray-600">Eingehende Bestellungen verwalten</p>
            </div>
          </Link>

          {/* Sortiment */}
          <Link href="/admin/products" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-4xl mb-4">🏷️</div>
              <h2 className="text-lg font-semibold mb-2">Sortiment</h2>
              <p className="text-gray-600">Produkte und Kategorien pflegen</p>
            </div>
          </Link>

          {/* Preisliste */}
          <Link href="/admin/prices" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-4xl mb-4">💰</div>
              <h2 className="text-lg font-semibold mb-2">Preisliste</h2>
              <p className="text-gray-600">PZNs, Anbieter & Preise verwalten</p>
            </div>
          </Link>

          {/* Pflegeheime */}
          <Link href="/admin/carehomes" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-4xl mb-4">🏥</div>
              <h2 className="text-lg font-semibold mb-2">Pflegeheime</h2>
              <p className="text-gray-600">Zugänge verwalten</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
