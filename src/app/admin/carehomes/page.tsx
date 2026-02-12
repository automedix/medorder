import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import CareHomesClient from './CareHomesClient'

export default async function CareHomesPage() {
  const session = await getServerSession(authOptions as any)
  
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login')
  }

  return <CareHomesClient />
}
