'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  status: string
  createdAt: string
  totalItems: number
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  archiveNote: string | null
  archivedAt: string
  careHome: {
    id: string
    name: string
    email: string
  }
  orders: Order[]
}

interface CareHomeGroup {
  careHome: {
    id: string
    name: string
    email: string
  }
  patients: Patient[]
}

export default function ArchivePage() {
  const router = useRouter()
  const [groupedPatients, setGroupedPatients] = useState<Record<string, CareHomeGroup>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchArchivedPatients()
  }, [])

  const fetchArchivedPatients = async () => {
    try {
      const res = await fetch('/api/admin/archive/patients')
      if (res.ok) {
        const data = await res.json()
        setGroupedPatients(data)
      } else if (res.status === 401) {
        router.push('/login')
      } else {
        setError('Fehler beim Laden der archivierten Patienten')
      }
    } catch (error) {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const togglePatientExpand = (patientId: string) => {
    setExpandedPatients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(patientId)) {
        newSet.delete(patientId)
      } else {
        newSet.add(patientId)
      }
      return newSet
    })
  }

  const unarchivePatient = async (patientId: string) => {
    if (!confirm('Möchten Sie diesen Patienten wirklich wieder aktivieren?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/patients/${patientId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false })
      })

      if (res.ok) {
        fetchArchivedPatients()
      } else {
        setError('Fehler beim Reaktivieren des Patienten')
      }
    } catch (error) {
      setError('Verbindungsfehler')
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8" style={{backgroundColor: '#4477BB'}}>Laden...</div>
  }

  const careHomeGroups = Object.values(groupedPatients)
  const totalArchivedPatients = careHomeGroups.reduce((sum, group) => sum + group.patients.length, 0)

  return (
    <div className="min-h-screen" style={{backgroundColor: '#4477BB'}}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Patienten-Archiv</h1>
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Zurück zum Admin
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistik */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-600">Archivierte Patienten gesamt:</span>
              <span className="ml-2 text-2xl font-bold text-gray-900">{totalArchivedPatients}</span>
            </div>
            <div>
              <span className="text-gray-600">Pflegeheime mit archivierten Patienten:</span>
              <span className="ml-2 text-2xl font-bold text-gray-900">{careHomeGroups.length}</span>
            </div>
          </div>
        </div>

        {careHomeGroups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Keine archivierten Patienten vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {careHomeGroups.map((group) => (
              <div key={group.careHome.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Pflegeheim Header */}
                <div className="bg-gray-100 px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">{group.careHome.name}</h2>
                  <p className="text-sm text-gray-600">{group.careHome.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {group.patients.length} archivierte(r) Patient(en)
                  </p>
                </div>

                {/* Patienten Liste */}
                <div className="divide-y divide-gray-200">
                  {group.patients.map((patient) => (
                    <div key={patient.id}>
                      <div 
                        className="p-6 hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => togglePatientExpand(patient.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {patient.lastName}, {patient.firstName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Geboren: {new Date(patient.dateOfBirth).toLocaleDateString('de-DE')}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Archiviert am: {new Date(patient.archivedAt).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                unarchivePatient(patient.id)
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Reaktivieren
                            </button>
                            <span className="text-gray-400">
                              {expandedPatients.has(patient.id) ? '▼' : '▶'}
                            </span>
                          </div>
                        </div>

                        {/* Archivierungsvermerk */}
                        {patient.archiveNote && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <span className="text-sm font-medium text-yellow-800">Vermerk:</span>
                            <p className="text-sm text-yellow-700">{patient.archiveNote}</p>
                          </div>
                        )}
                      </div>

                      {/* Erweiterte Details - Bestellhistorie */}
                      {expandedPatients.has(patient.id) && (
                        <div className="px-6 pb-6 bg-gray-50">
                          <h4 className="font-medium text-gray-900 mb-3">Bestellhistorie:</h4>
                          {patient.orders.length === 0 ? (
                            <p className="text-sm text-gray-500">Keine Bestellungen vorhanden.</p>
                          ) : (
                            <div className="space-y-2">
                              {patient.orders.map((order) => (
                                <div 
                                  key={order.id} 
                                  className="flex justify-between items-center p-3 bg-white rounded border"
                                >
                                  <div>
                                    <span className="font-mono text-sm font-medium text-gray-900">
                                      {order.orderNumber}
                                    </span>
                                    <span className="text-sm text-gray-600 ml-2">
                                      {new Date(order.createdAt).toLocaleDateString('de-DE')}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600">
                                      {order.totalItems} Artikel
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded ${
                                      order.status === 'COMPLETED' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {order.status === 'COMPLETED' ? 'Erledigt' : 'Offen'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
