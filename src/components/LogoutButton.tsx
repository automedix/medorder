'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    
    try {
      const response = await fetch('/api/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Hard redirect zur Login-Seite
        window.location.href = '/login'
      } else {
        throw new Error('Logout failed')
      }
    } catch (error) {
      console.error('Logout failed:', error)
      // Fallback: trotzdem redirect
      window.location.href = '/login'
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">{isLoggingOut ? '...' : 'Abmelden'}</span>
    </button>
  )
}
