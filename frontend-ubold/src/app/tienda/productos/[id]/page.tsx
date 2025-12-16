import { Container, Card, CardBody, Alert, Button, Form } from 'react-bootstrap'
import { notFound } from 'next/navigation'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import strapiClient from '@/lib/strapi/client'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function EditarProductoPage({ params }: { params: { id: string } }) {
  const productoId = params.id
  let producto: any = null
  let error: string | null = null

  try {
    // Intentar obtener el producto específico desde Strapi
    let response: any = null
    
    try {
      response = await strapiClient.get<any>(`/api/productos/${productoId}?populate=*`)
    } catch {
      try {
        response = await strapiClient.get<any>(`/api/products/${productoId}?populate=*`)
      } catch {
        response = await strapiClient.get<any>(`/api/ecommerce-productos/${productoId}?populate=*`)
      }
    }
    
    if (response.data) {
      producto = response.data
    } else {
      error = 'Producto no encontrado'
    }
  } catch (err: any) {
    error = err.message || 'Error al obtener el producto'
    console.error('Error al obtener producto:', err)
  }

  if (error && !producto) {
    notFound()
  }

  const attrs = producto?.attributes || {}

  return (
    <Container fluid>
      <PageBreadcrumb 
        title={`Editar Producto #${productoId}`} 
        subtitle="Tienda - Gestionar productos" 
      />
      
      <div className="row">
        <div className="col-12">
          <Card>
            <CardBody>
              <h4 className="card-title mb-4">Editar Producto #{productoId}</h4>
              
              {error && (
                <Alert variant="danger" className="mb-3">
                  <strong>Error:</strong> {error}
                </Alert>
              )}

              {producto && (
                <Form>
                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Nombre del Producto</Form.Label>
                        <Form.Control
                          type="text"
                          defaultValue={
                            attrs.nombre || 
                            attrs.name || 
                            attrs.titulo ||
                            attrs.title ||
                            ''
                          }
                        />
                      </Form.Group>
                    </div>

                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Precio</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          defaultValue={
                            attrs.precio || 
                            attrs.price || 
                            attrs.precio_venta ||
                            0
                          }
                        />
                      </Form.Group>
                    </div>

                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Stock</Form.Label>
                        <Form.Control
                          type="number"
                          defaultValue={
                            attrs.stock || 
                            attrs.cantidad ||
                            attrs.inventory ||
                            0
                          }
                        />
                      </Form.Group>
                    </div>

                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Estado</Form.Label>
                        <Form.Select
                          defaultValue={
                            attrs.estado || 
                            attrs.status ||
                            (attrs.publishedAt ? 'Publicado' : 'Borrador')
                          }
                        >
                          <option value="Publicado">Publicado</option>
                          <option value="Borrador">Borrador</option>
                          <option value="Pendiente">Pendiente</option>
                        </Form.Select>
                      </Form.Group>
                    </div>

                    <div className="col-12">
                      <Form.Group className="mb-3">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          defaultValue={
                            attrs.descripcion || 
                            attrs.description ||
                            attrs.descripcion_corta ||
                            ''
                          }
                        />
                      </Form.Group>
                    </div>
                  </div>

                  <Alert variant="info" className="mt-3">
                    <strong>ℹ️ Nota:</strong> Este formulario está en modo de solo lectura por ahora.
                    Para habilitar la edición, necesitamos configurar los permisos de escritura en Strapi
                    y agregar la funcionalidad de guardado.
                  </Alert>

                  <div className="mt-4 d-flex gap-2">
                    <Button variant="primary">
                      Guardar Cambios
                    </Button>
                    <Button variant="secondary" href="/tienda/productos">
                      Volver a Lista
                    </Button>
                  </div>
                </Form>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  )
}

