'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Form, Button, Row, Col, FormGroup, FormLabel, FormControl, Alert } from 'react-bootstrap'
import { LuSave, LuX } from 'react-icons/lu'

const AddEtiquetaForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    slug: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        throw new Error('El nombre de la etiqueta es obligatorio')
      }

      // Preparar datos para Strapi
      const etiquetaData: any = {
        data: {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || null,
          slug: formData.slug.trim() || formData.nombre.toLowerCase().replace(/\s+/g, '-'),
        },
      }

      console.log('[AddEtiquetaForm] Enviando datos:', etiquetaData)

      // Crear la etiqueta
      const response = await fetch('/api/tienda/etiquetas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(etiquetaData),
      })

      const result = await response.json()

      console.log('[AddEtiquetaForm] Respuesta:', { response: response.status, result })

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la etiqueta')
      }

      if (!result.success) {
        throw new Error(result.error || 'Error al crear la etiqueta')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/products/etiquetas')
      }, 1500)
    } catch (err: any) {
      console.error('[AddEtiquetaForm] Error al crear etiqueta:', err)
      setError(err.message || 'Error al crear la etiqueta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h5 className="mb-0">Agregar Nueva Etiqueta</h5>
        <p className="text-muted mb-0 mt-2 small">
          Completa los campos requeridos para crear una nueva etiqueta en el sistema.
        </p>
      </CardHeader>
      <CardBody>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            ¡Etiqueta creada exitosamente! Redirigiendo...
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={12}>
              <FormGroup>
                <FormLabel>
                  Nombre de la Etiqueta <span className="text-danger">*</span>
                </FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: Novela, Ensayo, Poesía"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  required
                />
                <small className="text-muted">
                  Nombre completo de la etiqueta (requerido).
                </small>
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup>
                <FormLabel>Slug</FormLabel>
                <FormControl
                  type="text"
                  placeholder="Se generará automáticamente si se deja vacío"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                />
                <small className="text-muted">
                  URL amigable para la etiqueta (opcional, se genera automáticamente).
                </small>
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup>
                <FormLabel>Descripción</FormLabel>
                <FormControl
                  as="textarea"
                  rows={4}
                  placeholder="Descripción detallada de la etiqueta..."
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />
                <small className="text-muted">
                  Descripción opcional de la etiqueta.
                </small>
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
              {loading ? 'Guardando...' : 'Guardar Etiqueta'}
            </Button>
            <Button
              type="button"
              variant="light"
              onClick={() => router.back()}
            >
              <LuX className="fs-sm me-2" />
              Cancelar
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}

export default AddEtiquetaForm

