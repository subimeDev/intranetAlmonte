import { Container } from 'react-bootstrap'
import { headers, cookies } from 'next/headers'
import type { Metadata } from 'next'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import SerieColeccionesListing from './components/SerieColeccionesListing'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Todas las Series/Colecciones',
}

export default async function Page() {
  let serieColecciones: any[] = []
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
    
    const response = await fetch(`${baseUrl}/api/tienda/serie-coleccion`, {
      cache: 'no-store', // Forzar fetch dinámico
      headers: {
        'Cookie': cookieHeader, // Pasar cookies del request original
      },
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      serieColecciones = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[SerieColecciones Page] Serie-colecciones obtenidas:', serieColecciones.length)
    } else {
      error = data.error || data.warning || 'Error al obtener series/colecciones'
      console.error('[SerieColecciones Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[SerieColecciones Page] Error al obtener serie-colecciones:', err)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Todas las Series/Colecciones" subtitle="Ecommerce" />
      <SerieColeccionesListing serieColecciones={serieColecciones} error={error} />
    </Container>
  )
}

