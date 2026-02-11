import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions as any)
  
  if (!session || (session.user as any).role !== 'careHome') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            MedOrder - Pflegeheim Dashboard
          </h1>
          <div className="text-sm text-gray-600">
            {(session.user as any).name}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Neue Bestellung */}
          <Link href="/order/new" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-4xl mb-4">🛒</div>
              <h2 className="text-lg font-semibold mb-2">Neue Bestellung</h2>
              <p className="text-gray-600">Verbandmaterial für Patienten bestellen</p>
            </div>
          </Link>

          {/* Meine Bestellungen */}
          <Link href="/orders" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-4xl mb-4">📋</div>
              <h2 className="text-lg font-semibold mb-2">Meine Bestellungen</h2>
              <p className="text-gray-600">Bestellhistorie und Status einsehen</p>
            </div>
          </Link>

          {/* Patienten */}
          <Link href="/patients" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-lg font-semibold mb-2">Patienten</h2>
              <p className="text-gray-600">Patienten verwalten und anlegen</p>
            </div>
          </Link>
        </div>

        {/* Schnell-Info */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">So funktioniert's:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Legen Sie zuerst einen Patienten an (oder wählen Sie einen vorhandenen)</li>
            <li>Wählen Sie die benötigten Verbandmaterialien aus dem Sortiment</li>
            <li>Senden Sie die Bestellung an die Praxis</li>
            <li>Sie erhalten eine Bestätigung mit Bestellnummer</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
