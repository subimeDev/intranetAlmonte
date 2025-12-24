import { Container } from 'react-bootstrap'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

<<<<<<< HEAD
import MarcaRequestsListing from './components/MarcaRequestsListing'
import PageBreadcrumb from '@/components/PageBreadcrumb'
=======
import PageBreadcrumb from '@/components/PageBreadcrumb'
import MarcaRequestsListing from './components/MarcaRequestsListing'
>>>>>>> origin/matiRama2

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
<<<<<<< HEAD
  title: 'Solicitudes de Marcas - Intranet Almonte',
}

export default async function Page() {
  let marcas: any[] = []
=======
  title: 'Solicitudes de Marcas',
}

export default async function Page() {
  let solicitudes: any[] = []
>>>>>>> origin/matiRama2
  let error: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`
<<<<<<< HEAD
    
    const response = await fetch(`${baseUrl}/api/tienda/marca`, {
      cache: 'no-store',
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      marcas = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[Marca Requests Page] Marcas obtenidas:', marcas.length)
    } else {
      error = data.error || 'Error al obtener marcas'
      console.error('[Marca Requests Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Marca Requests Page] Error al obtener marcas:', err)
=======

    const response = await fetch(`${baseUrl}/api/tienda/marca`, {
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success && data.data) {
      solicitudes = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[Solicitudes Marcas Page] Solicitudes obtenidas:', solicitudes.length)
    } else {
      error = data.error || 'Error al obtener solicitudes de marcas'
      console.error('[Solicitudes Marcas Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Solicitudes Marcas Page] Error al obtener solicitudes:', err)
>>>>>>> origin/matiRama2
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Solicitudes de Marcas" subtitle="Ecommerce" />
<<<<<<< HEAD
      <MarcaRequestsListing marcas={marcas} error={error} />
=======
      <MarcaRequestsListing solicitudes={solicitudes} error={error} />
>>>>>>> origin/matiRama2
    </Container>
  )
}
