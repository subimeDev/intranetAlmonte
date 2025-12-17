'use client'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { Button, Card, CardBody, Col, Form, Alert } from 'react-bootstrap'
import { TbPencil, TbCheck, TbX, TbUpload } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

import { STRAPI_API_URL } from '@/lib/strapi/config'

interface ProductDisplayProps {
  producto: any
}

const ProductDisplay = ({ producto }: ProductDisplayProps) => {
  const router = useRouter()
  const [isEditingImage, setIsEditingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
  const [isSaving, setIsSaving] = useState(false)
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

  const currentImageUrl = getImageUrl()
  
  // Obtener el ID correcto: preferir id numérico, luego documentId
  // El ID numérico es el que usa Strapi para las actualizaciones
  const productId = producto.id?.toString() || producto.documentId || 'unknown'
  
  console.log('[ProductDisplay] ID del producto:', {
    productoId: productId,
    tieneId: !!producto.id,
    tieneDocumentId: !!producto.documentId,
    idValue: producto.id,
    documentIdValue: producto.documentId,
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadMode('file')
    }
  }

  const handleSaveImage = async () => {
    setIsSaving(true)
    setError(null)

    try {
      let imageId: number | null = null

      if (uploadMode === 'file') {
        const file = fileInputRef.current?.files?.[0]
        if (!file) {
          throw new Error('Por favor selecciona un archivo')
        }

        // Subir archivo a Strapi
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/tienda/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadResponse.json()

        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Error al subir archivo')
        }

        imageId = uploadData.id
      } else if (imageUrl.trim()) {
        // Si es URL, necesitaríamos buscar o crear la imagen en Strapi
        // Por ahora, solo guardamos la URL como texto (esto requeriría más lógica)
        throw new Error('Subir por URL aún no está implementado. Por favor usa la opción de subir archivo.')
      }

      // Actualizar producto con la nueva imagen
      const updateResponse = await fetch(`/api/tienda/productos/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portada_libro: imageId,
        }),
      })

      const updateData = await updateResponse.json()

      if (!updateData.success) {
        throw new Error(updateData.error || 'Error al actualizar producto')
      }

      // Recargar la página para mostrar los cambios
      router.refresh()
      setIsEditingImage(false)
    } catch (err: any) {
      setError(err.message || 'Error al guardar imagen')
      console.error('Error al guardar imagen:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Col xl={4}>
      <Card className="card-top-sticky border-0">
        <CardBody className="p-0">
          <div className="position-relative">
            <div
              className="bg-light bg-opacity-25 border border-light border-dashed rounded-3"
              style={{
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {isEditingImage ? (
                <div className="p-3 w-100">
                  {error && (
                    <Alert variant="danger" className="mb-2 py-2">
                      <small>{error}</small>
                    </Alert>
                  )}
                  
                  <div className="mb-3">
                    <div className="btn-group w-100" role="group">
                      <Button
                        variant={uploadMode === 'url' ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => setUploadMode('url')}
                      >
                        URL
                      </Button>
                      <Button
                        variant={uploadMode === 'file' ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => setUploadMode('file')}
                      >
                        <TbUpload className="me-1" /> Subir Archivo
                      </Button>
                    </div>
                  </div>

                  {uploadMode === 'url' ? (
                    <Form.Control
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="URL de la imagen"
                      className="mb-2"
                    />
                  ) : (
                    <Form.Control
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="mb-2"
                    />
                  )}

                  <div className="d-flex gap-2">
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={handleSaveImage}
                      disabled={isSaving || (uploadMode === 'url' && !imageUrl.trim()) || (uploadMode === 'file' && !fileInputRef.current?.files?.[0])}
                    >
                      <TbCheck className="me-1" /> {isSaving ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => {
                        setIsEditingImage(false)
                        setError(null)
                        setImageUrl('')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      disabled={isSaving}
                    >
                      <TbX className="me-1" /> Cancelar
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
                  <Button
                    variant="light"
                    size="sm"
                    className="position-absolute top-0 end-0 m-2"
                    onClick={() => setIsEditingImage(true)}
                    title="Editar imagen"
                  >
                    <TbPencil className="fs-sm" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  )
}

export default ProductDisplay
