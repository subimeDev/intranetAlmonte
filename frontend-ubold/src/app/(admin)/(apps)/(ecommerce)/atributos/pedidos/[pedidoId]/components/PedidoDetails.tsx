'use client'

import { Badge, Col, Row, Alert, Card, CardHeader, CardBody, Form, Button, FormGroup, FormLabel, FormControl } from 'react-bootstrap'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LuSave, LuX } from 'react-icons/lu'

interface PedidoDetailsProps {
  pedido: any
  pedidoId: string
  error?: string | null
}

// Helper para obtener campo con múltiples variaciones
const getField = (obj: any, ...fieldNames: string[]): any => {
  for (const fieldName of fieldNames) {
    if (obj[fieldName] !== undefined && obj[fieldName] !== null && obj[fieldName] !== '') {
      return obj[fieldName]
    }
  }
  return undefined
}

const PedidoDetails = ({ pedido: initialPedido, pedidoId, error: initialError }: PedidoDetailsProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [success, setSuccess] = useState(false)
  const [pedido, setPedido] = useState(initialPedido)
  
  if (!pedido && !initialError) {
    return (
      <Alert variant="warning">
        <strong>Cargando...</strong> Obteniendo información del pedido.
      </Alert>
    )
  }

  if (initialError && !pedido) {
    return (
      <Alert variant="danger">
        <strong>Error:</strong> {initialError}
      </Alert>
    )
  }
  
  const attrs = pedido.attributes || {}
  const data = (attrs && Object.keys(attrs).length > 0) ? attrs : (pedido as any)

  // Inicializar formData con los valores del pedido
  const [formData, setFormData] = useState({
    numero_pedido: getField(data, 'numero_pedido', 'numeroPedido', 'NUMERO_PEDIDO') || '',
    fecha_pedido: getField(data, 'fecha_pedido', 'fechaPedido', 'FECHA_PEDIDO') || new Date().toISOString().slice(0, 16),
    estado: getField(data, 'estado', 'ESTADO') || 'pendiente',
    total: getField(data, 'total', 'TOTAL')?.toString() || '',
    subtotal: getField(data, 'subtotal', 'SUBTOTAL')?.toString() || '',
    impuestos: getField(data, 'impuestos', 'IMPUESTOS')?.toString() || '',
    envio: getField(data, 'envio', 'ENVIO')?.toString() || '',
    descuento: getField(data, 'descuento', 'DESCUENTO')?.toString() || '',
    moneda: getField(data, 'moneda', 'MONEDA') || 'CLP',
    origen: getField(data, 'origen', 'ORIGEN') || 'woocommerce',
    metodo_pago: getField(data, 'metodo_pago', 'metodoPago', 'METODO_PAGO') || '',
    metodo_pago_titulo: getField(data, 'metodo_pago_titulo', 'metodoPagoTitulo', 'METODO_PAGO_TITULO') || '',
    nota_cliente: getField(data, 'nota_cliente', 'notaCliente', 'NOTA_CLIENTE') || '',
    originPlatform: getField(data, 'originPlatform', 'origin_platform', 'ORIGIN_PLATFORM') || 'woo_moraleja',
  })

  // Actualizar formData cuando cambie el pedido
  useEffect(() => {
    if (pedido) {
      const attrs = pedido.attributes || {}
      const data = (attrs && Object.keys(attrs).length > 0) ? attrs : (pedido as any)
      
      setFormData({
        numero_pedido: getField(data, 'numero_pedido', 'numeroPedido', 'NUMERO_PEDIDO') || '',
        fecha_pedido: getField(data, 'fecha_pedido', 'fechaPedido', 'FECHA_PEDIDO') || new Date().toISOString().slice(0, 16),
        estado: getField(data, 'estado', 'ESTADO') || 'pendiente',
        total: getField(data, 'total', 'TOTAL')?.toString() || '',
        subtotal: getField(data, 'subtotal', 'SUBTOTAL')?.toString() || '',
        impuestos: getField(data, 'impuestos', 'IMPUESTOS')?.toString() || '',
        envio: getField(data, 'envio', 'ENVIO')?.toString() || '',
        descuento: getField(data, 'descuento', 'DESCUENTO')?.toString() || '',
        moneda: getField(data, 'moneda', 'MONEDA') || 'CLP',
        origen: getField(data, 'origen', 'ORIGEN') || 'woocommerce',
        metodo_pago: getField(data, 'metodo_pago', 'metodoPago', 'METODO_PAGO') || '',
        metodo_pago_titulo: getField(data, 'metodo_pago_titulo', 'metodoPagoTitulo', 'METODO_PAGO_TITULO') || '',
        nota_cliente: getField(data, 'nota_cliente', 'notaCliente', 'NOTA_CLIENTE') || '',
        originPlatform: getField(data, 'originPlatform', 'origin_platform', 'ORIGIN_PLATFORM') || 'woo_moraleja',
      })
    }
  }, [pedido])

  // Obtener el ID correcto
  const pId = pedido.id?.toString() || pedido.documentId || pedidoId
  
  const createdAt = attrs.createdAt || pedido.createdAt || new Date().toISOString()
  const createdDate = new Date(createdAt)
  const updatedAt = attrs.updatedAt || pedido.updatedAt || new Date().toISOString()
  const updatedDate = new Date(updatedAt)

  // Validar que pedido existe
  if (!pedido) {
    return (
      <Alert variant="warning">
        <strong>Error:</strong> No se pudo cargar la información del pedido.
      </Alert>
    )
  }

  // Validar que tenemos un ID válido
  if (!pId || pId === 'unknown') {
    console.error('[PedidoDetails] No se pudo obtener un ID válido del pedido:', {
      id: pedido.id,
      documentId: pedido.documentId,
      pedido: pedido,
    })
    return (
      <Alert variant="danger">
        <strong>Error:</strong> No se pudo obtener el ID del pedido.
      </Alert>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const url = `/api/tienda/pedidos/${pId}`
      const body = JSON.stringify({
        data: {
          numero_pedido: formData.numero_pedido.trim(),
          fecha_pedido: formData.fecha_pedido || new Date().toISOString(),
          estado: formData.estado || 'pendiente',
          total: formData.total ? parseFloat(formData.total) : null,
          subtotal: formData.subtotal ? parseFloat(formData.subtotal) : null,
          impuestos: formData.impuestos ? parseFloat(formData.impuestos) : null,
          envio: formData.envio ? parseFloat(formData.envio) : null,
          descuento: formData.descuento ? parseFloat(formData.descuento) : null,
          moneda: formData.moneda || 'CLP',
          origen: formData.origen || 'woocommerce',
          metodo_pago: formData.metodo_pago || null,
          metodo_pago_titulo: formData.metodo_pago_titulo || null,
          nota_cliente: formData.nota_cliente || null,
          originPlatform: formData.originPlatform,
        },
      })
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el pedido')
      }

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar el pedido')
      }

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err: any) {
      console.error('[PedidoDetails] Error al actualizar pedido:', err)
      setError(err.message || 'Error al actualizar el pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row>
      <Col xs={12}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            ¡Pedido actualizado exitosamente!
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Detalles del Pedido</h5>
                <p className="text-muted mb-0 mt-2 small">
                  Información y configuración del pedido {formData.numero_pedido || pedidoId}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <Badge bg="secondary">
                  Creado: {format(createdDate, 'dd MMM, yyyy h:mm a')}
                </Badge>
                <Badge bg="info">
                  Actualizado: {format(updatedDate, 'dd MMM, yyyy h:mm a')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>
                      Número de Pedido <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      value={formData.numero_pedido}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, numero_pedido: e.target.value }))
                      }
                      required
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <FormLabel>
                      Fecha del Pedido <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="datetime-local"
                      value={formData.fecha_pedido}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, fecha_pedido: e.target.value }))
                      }
                      required
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <FormLabel>
                      Estado <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      as="select"
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, estado: e.target.value }))
                      }
                      required
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="procesando">Procesando</option>
                      <option value="en_espera">En Espera</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="reembolsado">Reembolsado</option>
                      <option value="fallido">Fallido</option>
                    </FormControl>
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <FormLabel>
                      Plataforma de Origen <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      as="select"
                      value={formData.originPlatform}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, originPlatform: e.target.value }))
                      }
                      required
                    >
                      <option value="woo_moraleja">WooCommerce Moraleja</option>
                      <option value="woo_escolar">WooCommerce Escolar</option>
                      <option value="otros">Otros</option>
                    </FormControl>
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Total</FormLabel>
                    <FormControl
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, total: e.target.value }))
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Subtotal</FormLabel>
                    <FormControl
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.subtotal}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subtotal: e.target.value }))
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md={4}>
                  <FormGroup>
                    <FormLabel>Impuestos</FormLabel>
                    <FormControl
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.impuestos}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, impuestos: e.target.value }))
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md={4}>
                  <FormGroup>
                    <FormLabel>Envío</FormLabel>
                    <FormControl
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.envio}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, envio: e.target.value }))
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md={4}>
                  <FormGroup>
                    <FormLabel>Descuento</FormLabel>
                    <FormControl
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.descuento}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, descuento: e.target.value }))
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Moneda</FormLabel>
                    <FormControl
                      type="text"
                      value={formData.moneda}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, moneda: e.target.value }))
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Método de Pago</FormLabel>
                    <FormControl
                      type="text"
                      value={formData.metodo_pago}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, metodo_pago: e.target.value }))
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md={12}>
                  <FormGroup>
                    <FormLabel>Nota del Cliente</FormLabel>
                    <FormControl
                      as="textarea"
                      rows={3}
                      value={formData.nota_cliente}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nota_cliente: e.target.value }))
                      }
                    />
                  </FormGroup>
                </Col>
              </Row>

              <div className="d-flex gap-2 mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  <LuSave className="fs-sm me-2" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  type="button"
                  variant="light"
                  onClick={() => router.back()}
                >
                  <LuX className="fs-sm me-2" />
                  Volver
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default PedidoDetails

