import { Container } from 'react-bootstrap'
import { headers, cookies } from 'next/headers'
import type { Metadata } from 'next'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import MarcasListing from './components/MarcasListing'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Todas las Marcas',
}

export default async function Page() {
  let marcas: any[] = []
  let error: string | null = null

  try {
    const headersList = await headers()
    const cookieStore = await cookies()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`
    
    // Construir el header Cookie con todas las cookies del request original
    const cookieHeader = cookieStore.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ')
    
    const response = await fetch(`${baseUrl}/api/tienda/marca`, {
      cache: 'no-store',
      headers: {
        'Cookie': cookieHeader, // Pasar cookies del request original
      },
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      marcas = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[Marcas Page] Marcas obtenidas:', marcas.length)
    } else {
      error = data.error || 'Error al obtener marcas'
      console.error('[Marcas Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Marcas Page] Error al obtener marcas:', err)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Todas las Marcas" subtitle="Ecommerce" />
      <MarcasListing marcas={marcas} error={error} />
    </Container>
  )
}



