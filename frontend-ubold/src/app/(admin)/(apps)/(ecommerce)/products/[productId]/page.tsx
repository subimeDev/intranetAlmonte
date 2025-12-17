import { Card, CardBody, Col, Container, Row, Alert } from 'react-bootstrap'
import { headers } from 'next/headers'

import ProductDetails from '@/app/(admin)/(apps)/(ecommerce)/products/[productId]/components/ProductDetails'
import ProductDisplay from '@/app/(admin)/(apps)/(ecommerce)/products/[productId]/components/ProductDisplay'
import ProductReviews from '@/app/(admin)/(apps)/(ecommerce)/products/[productId]/components/ProductReviews'
import PageBreadcrumb from '@/components/PageBreadcrumb'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    productId: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { productId } = await params
  let producto: any = null
  let error: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`
    
    console.log('[Product Details Page] Obteniendo producto:', {
      productId,
      baseUrl,
      url: `${baseUrl}/api/tienda/productos/${productId}`,
    })
    
    const response = await fetch(`${baseUrl}/api/tienda/productos/${productId}`, {
      cache: 'no-store',
    })
    
    const data = await response.json()
    
    console.log('[Product Details Page] Respuesta de API:', {
      success: data.success,
      hasData: !!data.data,
      error: data.error,
    })
    
    if (data.success && data.data) {
      producto = data.data
    } else {
      error = data.error || `Error al obtener producto: ${response.status} ${response.statusText}`
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con la API'
    console.error('[Product Details Page] Error al obtener producto:', {
      productId,
      error: err.message,
      stack: err.stack,
    })
  }

  if (error || !producto) {
    return (
      <Container fluid>
        <PageBreadcrumb title="Product Details" subtitle="Ecommerce" />
        <Alert variant="danger">
          <div>
            <strong>Error:</strong> {error || 'Producto no encontrado'}
            <div className="mt-3">
              <h5>¿Qué puedes hacer?</h5>
              <ul>
                <li>
                  <a href="/products/debug" className="text-decoration-none">
                    Ver página de debug para ver qué IDs existen
                  </a>
                </li>
                <li>
                  <a href="/products" className="text-decoration-none">
                    Volver a la lista de productos
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Alert>
      </Container>
    )
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Product Details" subtitle="Ecommerce" />

      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <Row>
                <ProductDisplay producto={producto} />

                <Col xl={8}>
                  <div className="p-4">
                    <ProductDetails producto={producto} />

                    <ProductReviews producto={producto} />
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
