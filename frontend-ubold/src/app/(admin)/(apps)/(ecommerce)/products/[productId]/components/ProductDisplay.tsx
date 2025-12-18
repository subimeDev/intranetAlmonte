'use client'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { Button, Card, CardBody, Col, Form, Alert } from 'react-bootstrap'
import { TbPencil, TbCheck, TbX, TbUpload } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

import { STRAPI_API_URL } from '@/lib/strapi/config'

interface ProductDisplayProps {
  producto: any
  onUpdate?: () => void
}

const ProductDisplay = ({ producto, onUpdate }: ProductDisplayProps) => {
  const router = useRouter()
  const [isEditingImage, setIsEditingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obtener URL de imagen (misma lógica que Products Grid)
  const getImageUrl = (): string | null => {
    const attrs = producto.attributes || {}
    const data = (attrs && Object.keys(attrs).length > 0) ? attrs : (producto as any)
    
    let portada = data.portada_libro || data.PORTADA_LIBRO || data.portadaLibro
    if (portada?.data) {
      portada = portada.data
    }
    
    if (!portada || portada === null) {
      return null
    }

    const url = portada.attributes?.url || portada.attributes?.URL || portada.url || portada.URL
    if (!url) {
      return null
    }

    if (url.startsWith('http')) {
      return url
    }

    const baseUrl = STRAPI_API_URL.replace(/\/$/, '')
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
  }

  // Validar que producto existe
  if (!producto) {
    return (
      <Col xl={4}>
        <Alert variant="warning">
          <strong>Error:</strong> No se pudo cargar la información del producto.
        </Alert>
      </Col>
    )
  }

  const currentImageUrl = getImageUrl()
  
  // Obtener el ID correcto: preferir id numérico, luego documentId
  // El ID numérico es el que usa Strapi para las actualizaciones
  const productId = producto.id?.toString() || producto.documentId
  
  // Validar que tenemos un ID válido
  if (!productId || productId === 'unknown') {
    console.error('[ProductDisplay] No se pudo obtener un ID válido del producto:', {
      id: producto.id,
      documentId: producto.documentId,
      producto: producto,
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB')
      return
    }

    setSelectedFile(file)
    setUploadMethod('file')
    setError(null)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async () => {
    setUploading(true)
    setError(null)

    try {
      let imageId: number

      if (uploadMethod === 'url') {
        // Subir por URL
        if (!imageUrl.trim()) {
          throw new Error('Por favor ingresa una URL válida')
        }

        const response = await fetch('/api/tienda/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageUrl })
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Error al subir imagen por URL')
        }

        imageId = data.data.id

      } else {
        // Subir desde PC
        if (!selectedFile) {
          throw new Error('Por favor selecciona un archivo')
        }

        const formData = new FormData()
        formData.append('file', selectedFile)

        const response = await fetch('/api/tienda/upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Error al subir archivo')
        }

        imageId = data.data.id
      }

      console.log('[ProductDisplay] Imagen subida, ID:', imageId)

      // Actualizar producto con nueva imagen
      const updateResponse = await fetch(`/api/tienda/productos/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portada_libro: imageId
        })
      })

      const updateData = await updateResponse.json()

      if (!updateData.success) {
        throw new Error(updateData.error || 'Error al actualizar producto')
      }

      console.log('[ProductDisplay] ✅ Producto actualizado con nueva imagen')

      // Resetear estados
      setIsEditingImage(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      setImageUrl('')
      
      // Refrescar datos del producto
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }

    } catch (err: any) {
      console.error('[ProductDisplay] Error:', err)
      setError(err.message || 'Error al cambiar imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Col xl={4}>
      <Card className="card-top-sticky border-0">
        <CardBody>
          <h5 className="card-title mb-3">Imagen del Producto</h5>

          {/* Imagen Actual */}
          <div className="text-center mb-3">
            <div className="position-relative d-inline-block">
              <div
                className="bg-light bg-opacity-25 border border-light border-dashed rounded-3"
                style={{
                  width: '300px',
                  height: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
              {isEditingImage ? (
                <div className="p-3 w-100">
                  <h6 className="mb-3">Cambiar Imagen del Producto</h6>

                  {error && (
                    <Alert variant="danger" className="mb-2 py-2" dismissible onClose={() => setError(null)}>
                      <small>{error}</small>
                    </Alert>
                  )}

                  {/* Selector de método */}
                  <div className="btn-group w-100 mb-3" role="group">
                    <Button
                      variant={uploadMethod === 'file' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setUploadMethod('file')}
                    >
                      <TbUpload className="me-1" />
                      Subir desde PC
                    </Button>
                    <Button
                      variant={uploadMethod === 'url' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setUploadMethod('url')}
                    >
                      Subir por URL
                    </Button>
                  </div>

                  {/* Subir desde PC */}
                  {uploadMethod === 'file' && (
                    <>
                      <div className="mb-3">
                        <Form.Label>Seleccionar archivo</Form.Label>
                        <Form.Control
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                        <Form.Text className="text-muted">Formatos: JPG, PNG, WEBP. Máximo 5MB</Form.Text>
                      </div>

                      {previewUrl && (
                        <div className="mb-3 text-center">
                          <p className="text-muted mb-2">Vista previa:</p>
                          <div style={{ position: 'relative', width: '200px', height: '250px', margin: '0 auto' }}>
                            <Image
                              src={previewUrl}
                              alt="Preview"
                              fill
                              className="rounded"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Subir por URL */}
                  {uploadMethod === 'url' && (
                    <div className="mb-3">
                      <Form.Label>URL de la imagen</Form.Label>
                      <Form.Control
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <Form.Text className="text-muted">Pega la URL completa de la imagen</Form.Text>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={uploading || (uploadMethod === 'file' && !selectedFile) || (uploadMethod === 'url' && !imageUrl.trim())}
                      className="flex-grow-1"
                    >
                      {uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <TbCheck className="me-1" />
                          Guardar Imagen
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsEditingImage(false)
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        setImageUrl('')
                        setError(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      disabled={uploading}
                    >
                      <TbX className="me-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {currentImageUrl ? (
                    <Image
                      src={currentImageUrl}
                      alt="Product"
                      fill
                      style={{ objectFit: 'contain', padding: '20px' }}
                      unoptimized
                    />
                  ) : (
                    <div className="text-muted">Sin imagen</div>
                  )}
                  {!isEditingImage && (
                    <div className="position-absolute top-0 end-0 m-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => setIsEditingImage(true)}
                        title="Cambiar imagen"
                      >
                        <TbPencil className="me-1" />
                        Cambiar Imagen
                      </Button>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>

            {/* Botón para cambiar imagen (fuera del contenedor de imagen) */}
            {!isEditingImage && (
              <div className="text-center mt-3">
                <Button
                  variant="primary"
                  onClick={() => setIsEditingImage(true)}
                >
                  <TbPencil className="me-1" />
                  Cambiar Imagen
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </Col>
  )
}

export default ProductDisplay
