'use client'

import { useState, useEffect } from 'react'

interface Session {
  id: string
  email: string
  name: string
  role: 'admin' | 'careHome'
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        if (data.session) {
          setSession(data.session)
          setStatus('authenticated')
        } else {
          setSession(null)
          setStatus('unauthenticated')
        }
      } else {
        setSession(null)
        setStatus('unauthenticated')
      }
    } catch {
      setSession(null)
      setStatus('unauthenticated')
    }
  }

  return { session, status }
}