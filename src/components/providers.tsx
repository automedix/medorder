'use client'

export function Providers({ children }: { children: React.ReactNode }) {
  // SessionProvider removed - using custom JWT auth
  return <>{children}</>
}