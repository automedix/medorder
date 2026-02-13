import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProductsClient from './ProductsClient'

export default async function ProductsPage() {
  const session = await getSession()
  
  if (!session || session.role !== 'admin') {
    redirect('/login')
  }

  return <ProductsClient />
}
