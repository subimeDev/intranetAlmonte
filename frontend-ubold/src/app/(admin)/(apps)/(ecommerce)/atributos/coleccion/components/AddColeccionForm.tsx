'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Form, Button, Row, Col, FormGroup, FormLabel, FormControl, Alert } from 'react-bootstrap'
import { LuSave, LuX, LuUpload } from 'react-icons/lu'

const AddColeccionForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!formData.nombre.trim()) {
        throw new Error('El nombre de la colección es obligatorio')
      }

      const coleccionData: any = {
        data: {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || null,
        },
      }

      console.log('[AddColeccionForm] Enviando datos:', coleccionData)

      let imagenId = null
      if (formData.imagen) {
        try {
          const formDataImagen = new FormData()
          formDataImagen.append('file', formData.imagen)
          
          const uploadResponse = await fetch('/api/tienda/upload', {
            method: 'POST',
            body: formDataImagen,
          })
          
          const uploadResult = await uploadResponse.json()
          if (uploadResult.success && uploadResult.data && uploadResult.data.length > 0) {
            imagenId = uploadResult.data[0].id
            coleccionData.data.imagen = imagenId
          } else if (uploadResult.success && uploadResult.data?.id) {
            imagenId = uploadResult.data.id
            coleccionData.data.imagen = imagenId
          }
        } catch (uploadError: any) {
          console.warn('[AddColeccionForm] Error al subir imagen:', uploadError.message)
        }
      }

      const response = await fetch('/api/tienda/coleccion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coleccionData),
      })

      const result = await response.json()

      console.log('[AddColeccionForm] Respuesta:', { response: response.status, result })

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la colección')
      }

      if (!result.success) {
        throw new Error(result.error || 'Error al crear la colección')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/atributos/coleccion')
      }, 1500)
    } catch (err: any) {
      console.error('[AddColeccionForm] Error al crear coleccion:', err)
      setError(err.message || 'Error al crear la colección')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h5 className="mb-0">Agregar Nueva Colección</h5>
        <p className="text-muted mb-0 mt-2 small">
          Completa los campos requeridos para crear una nueva colección en el sistema.
        </p>
      </CardHeader>
      <CardBody>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <strong>¡Éxito!</strong> La colección se ha creado correctamente. Redirigiendo...
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={12}>
              <FormGroup className="mb-3">
                <FormLabel>
                  Nombre de la Colección <span className="text-danger">*</span>
                </FormLabel>
                <FormControl
                  type="text"
                  placeholder="Ej: Colección Ejemplo"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  required
                />
                <small className="text-muted">
                  Nombre único de la colección (obligatorio).
                </small>
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup className="mb-3">
                <FormLabel>Descripción</FormLabel>
                <FormControl
                  as="textarea"
                  rows={4}
                  placeholder="Descripción de la colección..."
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />
                <small className="text-muted">
                  Descripción opcional de la colección.
                </small>
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup>
                <FormLabel>Imagen</FormLabel>
                <div className="border rounded p-3 text-center" style={{ minHeight: '150px', backgroundColor: '#f8f9fa' }}>
                  {formData.imagen ? (
                    <div>
                      <img 
                        src={URL.createObjectURL(formData.imagen)} 
                        alt="Preview" 
                        style={{ maxHeight: '120px', maxWidth: '100%' }}
                        className="mb-2"
                      />
                      <div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setFormData((prev) => ({ ...prev, imagen: null }))}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <LuUpload className="fs-1 text-muted mb-2" />
                      <div className="text-muted small">
                        Click para agregar un archivo o arrastra y suelta uno en esta área
                      </div>
                      <FormControl
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement
                          const file = target.files?.[0]
                          if (file) {
                            setFormData((prev) => ({ ...prev, imagen: file }))
                          }
                        }}
                        className="mt-2"
                        style={{ display: 'none' }}
                        id="imagen-upload"
                      />
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => document.getElementById('imagen-upload')?.click()}
                        className="mt-2"
                      >
                        Seleccionar archivo
                      </Button>
                    </div>
                  )}
                </div>
                <small className="text-muted">
                  Imagen de la colección (opcional). Formatos: JPG, PNG, GIF.
                </small>
              </FormGroup>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              <LuX size={18} className="me-1" />
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
            >
              <LuSave size={18} className="me-1" />
              {loading ? 'Guardando...' : 'Guardar Colección'}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}

export default AddColeccionForm

