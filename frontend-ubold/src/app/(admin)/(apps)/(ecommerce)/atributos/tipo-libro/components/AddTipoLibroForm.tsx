'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Form, Button, Row, Col, FormGroup, FormLabel, FormControl, Alert } from 'react-bootstrap'
import { LuSave, LuX } from 'react-icons/lu'

const AddTipoLibroForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    codigo_tipo_libro: '',
    nombre_tipo_libro: '',
    descripcion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validaciones
      if (!formData.codigo_tipo_libro.trim()) {
        throw new Error('El código del tipo de libro es obligatorio')
      }

      if (!formData.nombre_tipo_libro.trim()) {
        throw new Error('El nombre del tipo de libro es obligatorio')
      }

      // Preparar datos para Strapi según schema real
      const tipoLibroData: any = {
        data: {
          codigo_tipo_libro: formData.codigo_tipo_libro.trim(),
          nombre_tipo_libro: formData.nombre_tipo_libro.trim(),
          descripcion: formData.descripcion.trim() || null,
        },
      }

      console.log('[AddTipoLibroForm] Enviando datos:', tipoLibroData)

      // Crear el tipo de libro
      const response = await fetch('/api/tienda/tipo-libro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tipoLibroData),
      })

      const result = await response.json()

      console.log('[AddTipoLibroForm] Respuesta:', { response: response.status, result })

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el tipo de libro')
      }

      if (!result.success) {
        throw new Error(result.error || 'Error al crear el tipo de libro')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/atributos/tipo-libro')
      }, 1500)
    } catch (err: any) {
      console.error('[AddTipoLibroForm] Error al crear tipo de libro:', err)
      setError(err.message || 'Error al crear el tipo de libro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h5 className="mb-0">Agregar Nuevo Tipo de Libro</h5>
        <p className="text-muted mb-0 mt-2 small">
          Completa los campos requeridos para crear un nuevo tipo de libro en el sistema.
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
            ¡Tipo de libro creado exitosamente! Redirigiendo...
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={12}>
              <FormGroup>
                <FormLabel>
                  Código del Tipo de Libro <span className="text-danger">*</span>
                </FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: TIPO-001, TEXT-001"
                  value={formData.codigo_tipo_libro}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, codigo_tipo_libro: e.target.value }))
                  }
                  required
                />
                <small className="text-muted">
                  Código único identificador del tipo de libro (requerido).
                </small>
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup>
                <FormLabel>
                  Nombre del Tipo de Libro <span className="text-danger">*</span>
                </FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: Texto del Estudiante, Guía del Profesor"
                  value={formData.nombre_tipo_libro}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre_tipo_libro: e.target.value }))
                  }
                  required
                />
                <small className="text-muted">
                  Nombre completo del tipo de libro (requerido).
                </small>
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup>
                <FormLabel>Descripción</FormLabel>
                <FormControl
                  as="textarea"
                  rows={4}
                  placeholder="Descripción detallada del tipo de libro..."
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />
                <small className="text-muted">
                  Descripción opcional del tipo de libro.
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
              {loading ? 'Guardando...' : 'Guardar Tipo de Libro'}
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

export default AddTipoLibroForm

