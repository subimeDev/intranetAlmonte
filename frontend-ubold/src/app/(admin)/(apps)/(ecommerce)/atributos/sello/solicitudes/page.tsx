import { Container } from 'react-bootstrap'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

<<<<<<< HEAD
import SelloRequestsListing from './components/SelloRequestsListing'
import PageBreadcrumb from '@/components/PageBreadcrumb'
=======
import PageBreadcrumb from '@/components/PageBreadcrumb'
import SelloRequestsListing from './components/SelloRequestsListing'
>>>>>>> origin/matiRama2

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
<<<<<<< HEAD
  title: 'Solicitudes de Sellos - Intranet Almonte',
}

export default async function Page() {
  let sellos: any[] = []
=======
  title: 'Solicitudes de Sellos',
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
    
    const response = await fetch(`${baseUrl}/api/tienda/sello`, {
      cache: 'no-store',
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      sellos = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[Sello Requests Page] Sellos obtenidos:', sellos.length)
    } else {
      error = data.error || 'Error al obtener sellos'
      console.error('[Sello Requests Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Sello Requests Page] Error al obtener sellos:', err)
=======

    const response = await fetch(`${baseUrl}/api/tienda/sello`, {
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success && data.data) {
      solicitudes = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[Solicitudes Sellos Page] Solicitudes obtenidas:', solicitudes.length)
    } else {
      error = data.error || 'Error al obtener solicitudes de sellos'
      console.error('[Solicitudes Sellos Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Solicitudes Sellos Page] Error al obtener solicitudes:', err)
>>>>>>> origin/matiRama2
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Solicitudes de Sellos" subtitle="Ecommerce" />
<<<<<<< HEAD
      <SelloRequestsListing sellos={sellos} error={error} />
=======
      <SelloRequestsListing solicitudes={solicitudes} error={error} />
>>>>>>> origin/matiRama2
    </Container>
  )
}
