import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CareHomesClient from './CareHomesClient'

export default async function CareHomesPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    redirect('/login')
  }

  return <CareHomesClient />
}