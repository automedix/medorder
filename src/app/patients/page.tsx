'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
}

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
      } else if (res.status === 401) {
        router.push('/login')
      } else {
        setError('Fehler beim Laden der Patienten')
      }
    } catch (error) {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      })
      
      if (res.ok) {
        setNewPatient({ firstName: '', lastName: '', dateOfBirth: '' })
        setShowForm(false)
        setSuccess('Patient erfolgreich angelegt!')
        fetchPatients()
        setTimeout(() => setSuccess(''), 3000)
      } else if (res.status === 401) {
        router.push('/login')
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      setError('Verbindungsfehler')
    }
  }

  if (loading) {
    return <div className="p-8">Laden...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold" style={{color: '#111827'}}>Patienten</h1>
          <div className="space-x-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Abbrechen' : '+ Neuen Patienten anlegen'}
        </button>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4" style={{color: '#111827'}}>Neuen Patienten anlegen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: '#374151'}}>
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                    className="w-full p-2 border rounded bg-white"
                    style={{ color: '#111827' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: '#374151'}}>
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                    className="w-full p-2 border rounded bg-white"
                    style={{ color: '#111827' }}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: '#374151'}}>
                  Geburtsdatum *
                </label>
                <input
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
                  className="w-full p-2 border rounded bg-white"
                  style={{ color: '#111827' }}
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Patient speichern
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left" style={{color: '#111827'}}>Name</th>
                <th className="px-4 py-3 text-left" style={{color: '#111827'}}>Geburtsdatum</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-t">
                  <td className="px-4 py-3" style={{color: '#111827'}}>
                    {patient.lastName}, {patient.firstName}
                  </td>
                  <td className="px-4 py-3" style={{color: '#111827'}}>
                    {new Date(patient.dateOfBirth).toLocaleDateString('de-DE')}
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center" style={{color: '#6b7280'}}>
                    Noch keine Patienten angelegt
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}