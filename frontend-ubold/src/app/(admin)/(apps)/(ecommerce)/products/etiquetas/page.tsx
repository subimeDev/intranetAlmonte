import { Container } from 'react-bootstrap'
import { headers, cookies } from 'next/headers'
import type { Metadata } from 'next'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import EtiquetasListing from './components/EtiquetasListing'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Todas las Etiquetas',
}

export default async function Page() {
  let etiquetas: any[] = []
  let error: string | null = null

  try {
    // Usar API Route como proxy
    const headersList = await headers()
    const cookieStore = await cookies()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`
    
    // Construir el header Cookie con todas las cookies del request original
    const cookieHeader = cookieStore.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ')
    
    const response = await fetch(`${baseUrl}/api/tienda/etiquetas`, {
      cache: 'no-store', // Forzar fetch dinámico
      headers: {
        'Cookie': cookieHeader, // Pasar cookies del request original
      },
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      etiquetas = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[Etiquetas Page] Etiquetas obtenidas:', etiquetas.length)
    } else {
      error = data.error || 'Error al obtener etiquetas'
      console.error('[Etiquetas Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Etiquetas Page] Error al obtener etiquetas:', err)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Todas las Etiquetas" subtitle="Ecommerce" />
      <EtiquetasListing etiquetas={etiquetas} error={error} />
    </Container>
  )
}

