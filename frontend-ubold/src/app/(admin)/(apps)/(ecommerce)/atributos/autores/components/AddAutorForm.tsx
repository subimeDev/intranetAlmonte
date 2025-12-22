'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Form, Button, Row, Col, FormGroup, FormLabel, FormControl, Alert, FormSelect } from 'react-bootstrap'
import { LuSave, LuX } from 'react-icons/lu'

const AddAutorForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo_autor: '',
    nombres: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_autor: 'Persona' as 'Persona' | 'Organización',
    website: '',
    pais: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validaciones
      if (!formData.nombre_completo_autor.trim()) {
        throw new Error('El nombre completo del autor es obligatorio')
      }

      // Preparar datos para Strapi
      const autorData: any = {
        data: {
          nombre_completo_autor: formData.nombre_completo_autor.trim(),
          nombres: formData.nombres.trim() || null,
          primer_apellido: formData.primer_apellido.trim() || null,
          segundo_apellido: formData.segundo_apellido.trim() || null,
          tipo_autor: formData.tipo_autor,
          website: formData.website.trim() || null,
          pais: formData.pais.trim() || null,
        },
      }

      console.log('[AddAutorForm] Enviando datos:', autorData)

      // Crear el autor
      const response = await fetch('/api/tienda/autores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(autorData),
      })

      const result = await response.json()

      console.log('[AddAutorForm] Respuesta:', { response: response.status, result })

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el autor')
      }

      if (!result.success) {
        throw new Error(result.error || 'Error al crear el autor')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/atributos/autores')
      }, 1500)
    } catch (err: any) {
      console.error('[AddAutorForm] Error al crear autor:', err)
      setError(err.message || 'Error al crear el autor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h5 className="mb-0">Agregar Nuevo Autor</h5>
        <p className="text-muted mb-0 mt-2 small">
          Completa los campos requeridos para crear un nuevo autor en el sistema.
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
            ¡Autor creado exitosamente! Redirigiendo...
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={12}>
              <FormGroup>
                <FormLabel>
                  Nombre Completo del Autor <span className="text-danger">*</span>
                </FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: Gabriel García Márquez, Editorial Santillana"
                  value={formData.nombre_completo_autor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre_completo_autor: e.target.value }))
                  }
                  required
                />
                <small className="text-muted">
                  Nombre completo del autor o organización (requerido).
                </small>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <FormLabel>Nombres</FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: Gabriel"
                  value={formData.nombres}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombres: e.target.value }))
                  }
                />
                <small className="text-muted">
                  Nombres del autor (opcional).
                </small>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <FormLabel>Primer Apellido</FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: García"
                  value={formData.primer_apellido}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, primer_apellido: e.target.value }))
                  }
                />
                <small className="text-muted">
                  Primer apellido del autor (opcional).
                </small>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <FormLabel>Segundo Apellido</FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: Márquez"
                  value={formData.segundo_apellido}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, segundo_apellido: e.target.value }))
                  }
                />
                <small className="text-muted">
                  Segundo apellido del autor (opcional).
                </small>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <FormLabel>Tipo de Autor</FormLabel>
                <FormSelect
                  value={formData.tipo_autor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tipo_autor: e.target.value as 'Persona' | 'Organización' }))
                  }
                >
                  <option value="Persona">Persona</option>
                  <option value="Organización">Organización</option>
                </FormSelect>
                <small className="text-muted">
                  Tipo de autor (Persona u Organización).
                </small>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <FormLabel>Website</FormLabel>
                <FormControl
                  type="url"
                  placeholder="https://ejemplo.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, website: e.target.value }))
                  }
                />
                <small className="text-muted">
                  Sitio web del autor (opcional).
                </small>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <FormLabel>País</FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: Chile, Argentina, España"
                  value={formData.pais}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pais: e.target.value }))
                  }
                />
                <small className="text-muted">
                  País del autor (opcional).
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
              {loading ? 'Guardando...' : 'Guardar Autor'}
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

export default AddAutorForm

