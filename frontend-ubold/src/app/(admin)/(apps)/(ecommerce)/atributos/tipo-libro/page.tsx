import { Container } from 'react-bootstrap'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import TipoLibroListing from './components/TipoLibroListing'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Todos los Tipos de Libro',
}

export default async function Page() {
  let tipoLibros: any[] = []
  let error: string | null = null

  try {
    // Usar API Route como proxy (igual que productos)
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`
    
    const response = await fetch(`${baseUrl}/api/tienda/tipo-libro`, {
      cache: 'no-store', // Forzar fetch dinámico
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      tipoLibros = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[Tipo Libro Page] Tipos de libro obtenidos:', tipoLibros.length)
    } else {
      error = data.error || 'Error al obtener tipos de libro'
      console.error('[Tipo Libro Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Tipo Libro Page] Error al obtener tipos de libro:', err)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Todos los Tipos de Libro" subtitle="Ecommerce" />
      <TipoLibroListing tipoLibros={tipoLibros} error={error} />
    </Container>
  )
}

