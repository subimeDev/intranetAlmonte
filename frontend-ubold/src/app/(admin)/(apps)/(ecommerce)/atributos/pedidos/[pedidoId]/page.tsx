import { Container } from 'react-bootstrap'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import PedidoDetails from './components/PedidoDetails'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Detalles del Pedido',
}

export default async function Page({ params }: { params: Promise<{ pedidoId: string }> }) {
  const { pedidoId } = await params
  let pedido: any = null
  let error: string | null = null

  try {
    // Usar API Route como proxy
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`
    
    const response = await fetch(`${baseUrl}/api/tienda/pedidos/${pedidoId}`, {
      cache: 'no-store', // Forzar fetch dinámico
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      pedido = data.data
      console.log('[Pedido Details Page] Pedido obtenido:', pedido.id || pedido.documentId)
    } else {
      error = data.error || 'Error al obtener pedido'
      console.error('[Pedido Details Page] Error en respuesta:', data)
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Pedido Details Page] Error al obtener pedido:', err)
  }

  if (error && !pedido) {
    notFound()
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Detalles del Pedido" subtitle="Ecommerce" />
      <PedidoDetails pedido={pedido} pedidoId={pedidoId} error={error} />
    </Container>
  )
}

