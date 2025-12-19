import { Container } from 'react-bootstrap'
import { headers } from 'next/headers'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import TipoLibroDetails from './components/TipoLibroDetails'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ tipoLibroId: string }> }) {
  const { tipoLibroId } = await params
  let tipoLibro: any = null
  let error: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`
    
    const response = await fetch(`${baseUrl}/api/tienda/tipo-libro/${tipoLibroId}`, {
      cache: 'no-store',
    })
    
    const data = await response.json()
    
    if (data.success && data.data) {
      tipoLibro = data.data
    } else {
      error = data.error || 'Error al obtener el tipo de libro'
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Detalles del Tipo de Libro" subtitle="Ecommerce" />
      <TipoLibroDetails tipoLibro={tipoLibro} tipoLibroId={tipoLibroId} error={error} />
    </Container>
  )
}

