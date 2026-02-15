'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      // Cookie wird gelöscht, jetzt zur Startseite leiten
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout failed')
      // Trotzdem zur Startseite
      window.location.href = '/'
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Abmelden</span>
    </button>
  )
}
