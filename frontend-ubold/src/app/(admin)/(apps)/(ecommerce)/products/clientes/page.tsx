import { Container } from 'react-bootstrap'
import { headers, cookies } from 'next/headers'
import type { Metadata } from 'next'

import ClientesListing from '@/app/(admin)/(apps)/(ecommerce)/products/clientes/components/ClientesListing'
import PageBreadcrumb from '@/components/PageBreadcrumb'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Todos los Clientes',
}

export default async function Page() {
  let clientes: any[] = []
  let error: string | null = null

  try {
    // Usar API Route como proxy (igual que productos)
    const headersList = await headers()
    const cookieStore = await cookies()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`
    
    // Construir el header Cookie con todas las cookies del request original
    const cookieHeader = cookieStore.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ')
    
    const response = await fetch(`${baseUrl}/api/tienda/clientes`, {
      cache: 'no-store', // Forzar fetch dinámico
      headers: {
        'Cookie': cookieHeader, // Pasar cookies del request original
      },
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      clientes = Array.isArray(data.data) ? data.data : [data.data]
      console.log('[Clientes Page] Clientes obtenidos:', clientes.length)
      if (clientes.length > 0) {
        console.log('[Clientes Page] Primer cliente:', JSON.stringify(clientes[0], null, 2))
      }
    } else {
      error = data.error || 'Error al obtener clientes'
      console.error('[Clientes Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Clientes Page] Error al obtener clientes:', err)
  }
  
  console.log('[Clientes Page] Render - clientes:', clientes.length, 'error:', error)

  return (
    <Container fluid>
      <PageBreadcrumb title="Todos los Clientes" subtitle="Ecommerce" />
      <ClientesListing clientes={clientes} error={error} />
    </Container>
  )
}

