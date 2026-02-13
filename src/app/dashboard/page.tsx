import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'careHome') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen style={{backgroundColor: '#4477BB'}}">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold" style={{color: '#111827'}}>
            MedOrder - Pflegeheim Dashboard
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Neue Bestellung */}
          <Link href="/order/new" className="block h-full">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition h-full flex flex-col">
              <div className="text-4xl mb-4">🛒</div>
              <h2 className="text-lg font-semibold mb-2" style={{color: '#111827'}}>Neue Bestellung</h2>
              <p className="flex-grow" style={{color: '#374151'}}>Verbandmaterial für Patienten bestellen</p>
            </div>
          </Link>

          {/* Meine Bestellungen */}
          <Link href="/orders" className="block h-full">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition h-full flex flex-col">
              <div className="text-4xl mb-4">📋</div>
              <h2 className="text-lg font-semibold mb-2" style={{color: '#111827'}}>Meine Bestellungen</h2>
              <p className="flex-grow" style={{color: '#374151'}}>Bestellhistorie und Status einsehen</p>
            </div>
          </Link>

          {/* Patienten */}
          <Link href="/patients" className="block h-full">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition h-full flex flex-col">
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-lg font-semibold mb-2" style={{color: '#111827'}}>Patienten</h2>
              <p className="flex-grow" style={{color: '#374151'}}>Patienten verwalten und anlegen</p>
            </div>
          </Link>
        </div>

        {/* Schnell-Info */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2" style={{color: '#1e40af'}}>So funktioniert's:</h3>
          <ol className="list-decimal list-inside space-y-2" style={{color: '#1d4ed8'}}>
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