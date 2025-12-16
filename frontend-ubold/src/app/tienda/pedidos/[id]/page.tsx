import { Container, Card, CardBody, Alert, Button, Form } from 'react-bootstrap'
import { notFound } from 'next/navigation'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import strapiClient from '@/lib/strapi/client'
import { STRAPI_API_URL } from '@/lib/strapi/config'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function EditarPedidoPage({ params }: { params: { id: string } }) {
  const pedidoId = params.id
  let pedido: any = null
  let error: string | null = null

  try {
    // Intentar obtener el pedido específico desde Strapi
    let response: any = null
    
    try {
      response = await strapiClient.get<any>(`/api/ecommerce-pedidos/${pedidoId}?populate=*`)
    } catch {
      try {
        response = await strapiClient.get<any>(`/api/wo-pedidos/${pedidoId}?populate=*`)
      } catch {
        response = await strapiClient.get<any>(`/api/pedidos/${pedidoId}?populate=*`)
      }
    }
    
    if (response.data) {
      pedido = response.data
    } else {
      error = 'Pedido no encontrado'
    }
  } catch (err: any) {
    error = err.message || 'Error al obtener el pedido'
    console.error('Error al obtener pedido:', err)
  }

  if (error && !pedido) {
    notFound()
  }

  const attrs = pedido?.attributes || {}

  return (
    <Container fluid>
      <PageBreadcrumb 
        title={`Editar Pedido #${pedidoId}`} 
        subtitle="Tienda - Gestionar productos" 
      />
      
      <div className="row">
        <div className="col-12">
          <Card>
            <CardBody>
              <h4 className="card-title mb-4">Editar Pedido #{pedidoId}</h4>
              
              {error && (
                <Alert variant="danger" className="mb-3">
                  <strong>Error:</strong> {error}
                </Alert>
              )}

              {pedido && (
                <Form>
                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Número de Pedido</Form.Label>
                        <Form.Control
                          type="text"
                          defaultValue={
                            attrs.NUMERO_PEDIDO || 
                            attrs.numero_pedido || 
                            attrs.numeroPedido || 
                            pedido.id
                          }
                          readOnly
                        />
                      </Form.Group>
                    </div>

                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Fecha de Pedido</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          defaultValue={
                            attrs.FECHA_PEDIDO || 
                            attrs.fecha_pedido || 
                            attrs.fechaPedido || 
                            attrs.createdAt
                          }
                        />
                      </Form.Group>
                    </div>

                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Estado</Form.Label>
                        <Form.Select
                          defaultValue={
                            attrs.ESTADO || 
                            attrs.estado || 
                            'Pendiente'
                          }
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Completado">Completado</option>
                          <option value="Cancelado">Cancelado</option>
                          <option value="En proceso">En proceso</option>
                        </Form.Select>
                      </Form.Group>
                    </div>

                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Estado de Publicación</Form.Label>
                        <Form.Select
                          defaultValue={attrs.publishedAt ? 'Published' : 'Draft'}
                        >
                          <option value="Published">Publicado</option>
                          <option value="Draft">Borrador</option>
                        </Form.Select>
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
                    <Button variant="secondary" href="/tienda/pedidos">
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

