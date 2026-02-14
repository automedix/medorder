'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterWrapper() {
  const pathname = usePathname()
  
  // Footer auf Login-Seite ausblenden
  if (pathname === '/login') {
    return null
  }
  
  return <Footer />
}
