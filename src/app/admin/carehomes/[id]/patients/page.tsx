'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  isActive: boolean
  isArchived: boolean
  archiveNote: string | null
  archivedAt: string | null
  createdAt: string
}

interface CareHome {
  id: string
  name: string
  email: string
}

export default function CareHomePatientsPage() {
  const router = useRouter()
  const params = useParams()
  const careHomeId = params.id as string

  const [careHome, setCareHome] = useState<CareHome | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Archivierung-Modal Zustand
  const [archivingPatient, setArchivingPatient] = useState<Patient | null>(null)
  const [archiveNote, setArchiveNote] = useState('')

  useEffect(() => {
    fetchData()
  }, [careHomeId])

  const fetchData = async () => {
    try {
      // CareHome laden
      const chRes = await fetch(`/api/carehomes/${careHomeId}`)
      if (chRes.ok) {
        setCareHome(await chRes.json())
      }

      // Patienten laden
      const pRes = await fetch(`/api/admin/carehomes/${careHomeId}/patients`)
      if (pRes.ok) {
        setPatients(await pRes.json())
      } else if (pRes.status === 401) {
        setError('Nicht autorisiert')
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch (err) {
      console.error('Fehler beim Laden:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const archivePatient = async () => {
    if (!archivingPatient || !archiveNote.trim()) {
      alert('Bitte geben Sie einen Vermerk ein (z.B. "verstorben", "umgezogen")')
      return
    }

    try {
      const res = await fetch(`/api/admin/patients/${archivingPatient.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true, archiveNote })
      })

      if (res.ok) {
        setArchivingPatient(null)
        setArchiveNote('')
        fetchData()
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unbekannter Fehler" }))
        console.error("Archivieren fehlgeschlagen:", errorData)
        alert('Fehler beim Archivieren')
      }
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Archivieren')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#4477BB' }}>
        <div className="p-8 text-white text-lg">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4477BB' }}>
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {careHome?.name || 'Pflegeheim'}
            </h1>
            <p className="text-gray-600 text-sm">{careHome?.email}</p>
          </div>
          <Link
            href="/admin/carehomes"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>
      </header>

      {/* Hauptinhalt */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Patienten ({patients.length})
            </h2>
          </div>

          {patients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Noch keine Patienten angelegt.
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geburtsdatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Angelegt am
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {patient.lastName}, {patient.firstName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {formatDate(patient.dateOfBirth)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.isArchived ? (
                        <div>
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            Archiviert
                          </span>
                          {patient.archiveNote && (
                            <p className="text-xs text-gray-500 mt-1">
                              {patient.archiveNote}
                            </p>
                          )}
                        </div>
                      ) : patient.isActive ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Aktiv
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Inaktiv
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {formatDate(patient.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!patient.isArchived && (
                        <button
                          onClick={() => setArchivingPatient(patient)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Deaktivieren
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Archivierung Modal */}
      {archivingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Patient deaktivieren
            </h3>
            <p className="text-gray-600 mb-4">
              <strong>{archivingPatient.firstName} {archivingPatient.lastName}</strong> wird archiviert.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vermerk (erfordert) *
              </label>
              <input
                type="text"
                placeholder="z.B. verstorben, umgezogen"
                value={archiveNote}
                onChange={(e) => setArchiveNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Dieser Vermerk wird für die Dokumentation gespeichert.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={archivePatient}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium"
              >
                Archivieren
              </button>
              <button
                onClick={() => {
                  setArchivingPatient(null)
                  setArchiveNote('')
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
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
