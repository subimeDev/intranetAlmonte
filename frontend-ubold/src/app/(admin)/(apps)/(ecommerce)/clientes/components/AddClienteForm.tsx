'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Form, Button, Row, Col, FormGroup, FormLabel, FormControl, Alert } from 'react-bootstrap'
import { LuSave, LuX } from 'react-icons/lu'

const AddClienteForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    correo_electronico: '',
    pedidos: '0',
    gasto_total: '0',
  })

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validar nombre y correo obligatorios
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del cliente es obligatorio')
      }

      if (!formData.correo_electronico.trim()) {
        throw new Error('El correo electrónico del cliente es obligatorio')
      }

      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.correo_electronico.trim())) {
        throw new Error('El correo electrónico no tiene un formato válido')
      }

      // Preparar datos para Strapi (solo campos válidos en el schema)
      const clienteData: any = {
        data: {
          nombre: formData.nombre.trim(),
          correo_electronico: formData.correo_electronico.trim(),
          pedidos: parseInt(formData.pedidos) || 0,
          gasto_total: parseFloat(formData.gasto_total) || 0,
          fecha_registro: new Date().toISOString(),
        },
      }

      // Crear el cliente
      const response = await fetch('/api/tienda/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el cliente')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/clientes')
      }, 1500)
    } catch (err: any) {
      console.error('Error al crear cliente:', err)
      setError(err.message || 'Error al crear el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row>
      <Col xs={12}>
        <Card>
          <CardHeader>
            <h4 className="card-title mb-0">Agregar Cliente</h4>
          </CardHeader>
          <CardBody>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                Cliente creado exitosamente. Redirigiendo...
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <FormLabel>
                      Nombre <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      value={formData.nombre}
                      onChange={(e) => handleFieldChange('nombre', e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <FormLabel>
                      Correo Electrónico <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="email"
                      placeholder="Ej: juan.perez@ejemplo.com"
                      value={formData.correo_electronico}
                      onChange={(e) => handleFieldChange('correo_electronico', e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <FormLabel>Pedidos</FormLabel>
                    <FormControl
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.pedidos}
                      onChange={(e) => handleFieldChange('pedidos', e.target.value)}
                    />
                    <small className="text-muted">Número total de pedidos realizados</small>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <FormLabel>Total Gastado</FormLabel>
                    <FormControl
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.gasto_total}
                      onChange={(e) => handleFieldChange('gasto_total', e.target.value)}
                    />
                    <small className="text-muted">Total acumulado de compras</small>
                  </FormGroup>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end">
                <Button
                  variant="light"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  <LuX className="me-1" /> Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <LuSave className="me-1" /> Guardar Cliente
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default AddClienteForm

