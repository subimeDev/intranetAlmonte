'use client'

import { Badge, Col, Row, Alert } from 'react-bootstrap'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TbPencil, TbCheck, TbX } from 'react-icons/tb'

import EditableField from './EditableField'

interface ProductDetailsProps {
  producto: any
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

const ProductDetails = ({ producto }: ProductDetailsProps) => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [savingField, setSavingField] = useState<string | null>(null)
  const [precio, setPrecio] = useState('')
  const [isEditingPrecio, setIsEditingPrecio] = useState(false)

  const attrs = producto.attributes || {}
  const data = (attrs && Object.keys(attrs).length > 0) ? attrs : (producto as any)

  const nombre = getField(data, 'nombre_libro', 'NOMBRE_LIBRO', 'nombreLibro') || 'Sin nombre'
  const isbn = getField(data, 'isbn_libro', 'ISBN_LIBRO', 'isbnLibro') || 'Sin ISBN'
  const descripcion = getField(data, 'descripcion', 'DESCRIPCION', 'descripcion') || ''
  const tipoLibro = getField(data, 'tipo_libro', 'TIPO_LIBRO', 'tipoLibro') || 'Sin categoría'
  const autor = data.autor_relacion?.data?.attributes?.nombre || data.autor_relacion?.data?.attributes?.NOMBRE || 'Sin autor'
  const editorial = data.editorial?.data?.attributes?.nombre || data.editorial?.data?.attributes?.NOMBRE || 'Sin editorial'
  
  // Calcular stock total
  const stocks = data.stocks?.data || data.STOCKS?.data || []
  const stockTotal = stocks.reduce((total: number, stock: any) => {
    const cantidad = stock.attributes?.cantidad || stock.attributes?.CANTIDAD || 0
    return total + (typeof cantidad === 'number' ? cantidad : 0)
  }, 0)

  // Obtener precio mínimo
  const precios = data.precios?.data || data.PRECIOS?.data || []
  const preciosNumeros = precios
    .map((p: any) => p.attributes?.precio || p.attributes?.PRECIO)
    .filter((p: any): p is number => typeof p === 'number' && p > 0)
  const precioMinimo = preciosNumeros.length > 0 ? Math.min(...preciosNumeros) : 0
  
  // Inicializar precio cuando se carga el componente
  useEffect(() => {
    if (!precio && precioMinimo > 0) {
      setPrecio(precioMinimo.toFixed(2))
    }
  }, [precioMinimo])

  const isPublished = !!(attrs.publishedAt || producto.publishedAt)
  const createdAt = attrs.createdAt || producto.createdAt || new Date().toISOString()
  const createdDate = new Date(createdAt)
  
  // Validar que producto existe
  if (!producto) {
    return (
      <Alert variant="warning">
        <strong>Error:</strong> No se pudo cargar la información del producto.
      </Alert>
    )
  }

  // Obtener el ID correcto: preferir id numérico, luego documentId
  // El ID numérico es el que usa Strapi para las actualizaciones
  const productId = producto.id?.toString() || producto.documentId
  
  // Validar que tenemos un ID válido
  if (!productId || productId === 'unknown') {
    console.error('[ProductDetails] No se pudo obtener un ID válido del producto:', {
      id: producto.id,
      documentId: producto.documentId,
      producto: producto,
    })
  }

  const handleSaveNombre = async (newValue: string) => {
    console.log('[ProductDetails] ===== INICIANDO GUARDADO DE NOMBRE =====')
    console.log('[ProductDetails] Datos del producto:', {
      id: producto.id,
      documentId: producto.documentId,
      productId,
      nombreActual: nombre,
      nombreNuevo: newValue,
      productoCompleto: producto,
    })
    
    if (!productId || productId === 'unknown') {
      console.error('[ProductDetails] ❌ ID inválido:', { productId })
      throw new Error('No se pudo obtener el ID del producto')
    }

    setSavingField('nombre')
    setError(null)

    try {
      const url = `/api/tienda/productos/${productId}`
      const body = JSON.stringify({
        nombre_libro: newValue,
      })
      
      console.log('[ProductDetails] Enviando petición PUT:', {
        url,
        productId,
        body,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      })
      
      console.log('[ProductDetails] Respuesta recibida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      if (!response.ok) {
        console.error('[ProductDetails] ❌ Respuesta no OK:', {
          status: response.status,
          statusText: response.statusText,
        })
        
        let errorData: any = {}
        try {
          const text = await response.text()
          console.log('[ProductDetails] Cuerpo de respuesta (texto):', text)
          errorData = JSON.parse(text)
          console.log('[ProductDetails] Cuerpo de respuesta (JSON):', errorData)
        } catch (parseError) {
          console.error('[ProductDetails] Error al parsear respuesta:', parseError)
        }
        
        const errorMessage = errorData.error || `Error HTTP: ${response.status}`
        
        console.error('[ProductDetails] Error completo:', {
          errorMessage,
          errorData,
          debug: errorData.debug,
        })
        
        // Si hay información de debug, incluirla en el error
        if (errorData.debug) {
          console.error('[ProductDetails] Debug info disponible:', errorData.debug)
          throw new Error(`${errorMessage}\n\nDebug: ${JSON.stringify(errorData.debug, null, 2)}`)
        }
        
        throw new Error(errorMessage)
      }

      let data: any = {}
      try {
        const text = await response.text()
        console.log('[ProductDetails] Cuerpo de respuesta exitosa (texto):', text)
        data = JSON.parse(text)
        console.log('[ProductDetails] Cuerpo de respuesta exitosa (JSON):', data)
      } catch (parseError) {
        console.error('[ProductDetails] Error al parsear respuesta exitosa:', parseError)
        throw new Error('Error al procesar la respuesta del servidor')
      }

      if (!data.success) {
        console.error('[ProductDetails] ❌ Respuesta indica error:', {
          success: data.success,
          error: data.error,
          debug: data.debug,
        })
        
        // Si hay información de debug, incluirla en el error
        if (data.debug) {
          console.error('[ProductDetails] Debug info disponible:', data.debug)
          throw new Error(`${data.error || 'Error al guardar nombre'}\n\nDebug: ${JSON.stringify(data.debug, null, 2)}`)
        }
        
        throw new Error(data.error || 'Error al guardar nombre')
      }

      console.log('[ProductDetails] ✅ Nombre guardado exitosamente:', {
        data,
        productoActualizado: data.data,
      })
      
      // Recargar la página para mostrar los cambios
      router.refresh()
    } catch (err: any) {
      const errorMessage = err.message || 'Error al guardar nombre'
      setError(errorMessage)
      console.error('[ProductDetails] Error al guardar nombre:', {
        productId,
        error: errorMessage,
        err,
      })
      throw err // Re-lanzar para que EditableField muestre el error
    } finally {
      setSavingField(null)
    }
  }

  const handleSaveDescripcion = async (newValue: string) => {
    console.log('[ProductDetails] ===== INICIANDO GUARDADO DE DESCRIPCIÓN =====')
    console.log('[ProductDetails] Datos del producto:', {
      id: producto.id,
      documentId: producto.documentId,
      productId,
      descripcionActual: descripcion,
      descripcionNueva: newValue,
    })
    
    if (!productId || productId === 'unknown') {
      console.error('[ProductDetails] ❌ ID inválido:', { productId })
      throw new Error('No se pudo obtener el ID del producto')
    }

    setSavingField('descripcion')
    setError(null)

    try {
      const url = `/api/tienda/productos/${productId}`
      const body = JSON.stringify({
        descripcion: newValue,
      })
      
      console.log('[ProductDetails] Enviando petición PUT:', {
        url,
        productId,
        body,
      })
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      })
      
      console.log('[ProductDetails] Respuesta recibida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      })

      if (!response.ok) {
        console.error('[ProductDetails] ❌ Respuesta no OK:', {
          status: response.status,
          statusText: response.statusText,
        })
        
        let errorData: any = {}
        try {
          const text = await response.text()
          console.log('[ProductDetails] Cuerpo de respuesta (texto):', text)
          errorData = JSON.parse(text)
          console.log('[ProductDetails] Cuerpo de respuesta (JSON):', errorData)
        } catch (parseError) {
          console.error('[ProductDetails] Error al parsear respuesta:', parseError)
        }
        
        const errorMessage = errorData.error || `Error HTTP: ${response.status}`
        
        if (errorData.debug) {
          console.error('[ProductDetails] Debug info disponible:', errorData.debug)
          throw new Error(`${errorMessage}\n\nDebug: ${JSON.stringify(errorData.debug, null, 2)}`)
        }
        
        throw new Error(errorMessage)
      }

      let data: any = {}
      try {
        const text = await response.text()
        console.log('[ProductDetails] Cuerpo de respuesta exitosa (texto):', text)
        data = JSON.parse(text)
        console.log('[ProductDetails] Cuerpo de respuesta exitosa (JSON):', data)
      } catch (parseError) {
        console.error('[ProductDetails] Error al parsear respuesta exitosa:', parseError)
        throw new Error('Error al procesar la respuesta del servidor')
      }

      if (!data.success) {
        console.error('[ProductDetails] ❌ Respuesta indica error:', {
          success: data.success,
          error: data.error,
          debug: data.debug,
        })
        
        if (data.debug) {
          console.error('[ProductDetails] Debug info disponible:', data.debug)
          throw new Error(`${data.error || 'Error al guardar descripción'}\n\nDebug: ${JSON.stringify(data.debug, null, 2)}`)
        }
        
        throw new Error(data.error || 'Error al guardar descripción')
      }

      console.log('[ProductDetails] ✅ Descripción guardada exitosamente:', {
        data,
        productoActualizado: data.data,
      })
      
      // Recargar la página para mostrar los cambios
      router.refresh()
    } catch (err: any) {
      const errorMessage = err.message || 'Error al guardar descripción'
      setError(errorMessage)
      console.error('[ProductDetails] Error al guardar descripción:', {
        productId,
        error: errorMessage,
        err,
      })
      throw err // Re-lanzar para que EditableField muestre el error
    } finally {
      setSavingField(null)
    }
  }

  const handleSavePrecio = async () => {
    if (!productId || productId === 'unknown') {
      throw new Error('No se pudo obtener el ID del producto')
    }

    setSavingField('precio')
    setError(null)

    try {
      const precioNumero = parseFloat(precio)
      if (isNaN(precioNumero) || precioNumero < 0) {
        throw new Error('Por favor ingresa un precio válido')
      }

      const url = `/api/tienda/productos/${productId}`
      const body = JSON.stringify({
        precio_base: precioNumero
      })

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar precio')
      }

      console.log('[ProductDetails] ✅ Precio guardado exitosamente')
      setIsEditingPrecio(false)
      router.refresh()
    } catch (err: any) {
      const errorMessage = err.message || 'Error al guardar precio'
      setError(errorMessage)
      console.error('[ProductDetails] Error al guardar precio:', {
        productId,
        error: errorMessage,
        err,
      })
      throw err
    } finally {
      setSavingField(null)
    }
  }

  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
          <small>{error}</small>
        </Alert>
      )}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <Badge 
          bg={isPublished ? 'success' : 'secondary'} 
          className={`${isPublished ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} px-2 py-1 fs-base rounded-pill`}
        >
          {isPublished ? 'Publicado' : 'Borrador'}
        </Badge>
        <div className="text-muted">
          Stock: <strong>{stockTotal}</strong>
        </div>
      </div>

      <div className="mt-3 mb-4">
        <EditableField
          value={nombre}
          onSave={handleSaveNombre}
          label="nombre"
          as="h4"
          className="fs-xl"
        />
      </div>

      <Row className="mb-4">
        <Col md={4} xl={3}>
          <h6 className="mb-1 text-muted text-uppercase">ISBN:</h6>
          <p className="fw-medium mb-0">{isbn}</p>
        </Col>
        <Col md={4} xl={3}>
          <h6 className="mb-1 text-muted text-uppercase">Categoría:</h6>
          <p className="fw-medium mb-0">{tipoLibro}</p>
        </Col>
        <Col md={4} xl={3}>
          <h6 className="mb-1 text-muted text-uppercase">Stock:</h6>
          <p className="fw-medium mb-0">{stockTotal}</p>
        </Col>
        <Col md={4} xl={3}>
          <h6 className="mb-1 text-muted text-uppercase">Publicado:</h6>
          <p className="fw-medium mb-0">
            {format(createdDate, 'dd MMM, yyyy')}
            <small className="text-muted ms-1">{format(createdDate, 'h:mm a')}</small>
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4} xl={3}>
          <h6 className="mb-1 text-muted text-uppercase">Autor:</h6>
          <p className="fw-medium mb-0">{autor}</p>
        </Col>
        <Col md={4} xl={3}>
          <h6 className="mb-1 text-muted text-uppercase">Editorial:</h6>
          <p className="fw-medium mb-0">{editorial}</p>
        </Col>
      </Row>

      {/* Precio Base */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="text-muted text-uppercase mb-0">Precio Base:</h6>
          {!isEditingPrecio && (
            <button
              type="button"
              className="btn btn-sm btn-link p-0"
              onClick={() => setIsEditingPrecio(true)}
              disabled={savingField !== null}
            >
              <TbPencil />
            </button>
          )}
        </div>
        
        {isEditingPrecio ? (
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              type="number"
              className="form-control"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Precio"
              step="0.01"
              min="0"
            />
            <button
              type="button"
              className="btn btn-success"
              onClick={async () => {
                try {
                  await handleSavePrecio()
                } catch (err) {
                  // Error ya manejado en handleSavePrecio
                }
              }}
              disabled={savingField === 'precio'}
            >
              {savingField === 'precio' ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <TbCheck />
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setPrecio(precioMinimo > 0 ? precioMinimo.toFixed(2) : '')
                setIsEditingPrecio(false)
              }}
              disabled={savingField === 'precio'}
            >
              <TbX />
            </button>
          </div>
        ) : (
          <h3 className="text-muted d-flex align-items-center gap-2 mb-0">
            <span className="fw-bold text-danger">
              ${precioMinimo > 0 ? precioMinimo.toFixed(2) : 'Sin precio'}
            </span>
          </h3>
        )}
      </div>

      <h5 className="text-uppercase text-muted fs-xs mb-2">Descripción:</h5>
      <EditableField
        value={descripcion}
        onSave={handleSaveDescripcion}
        label="descripción"
        type="textarea"
        placeholder="Sin descripción..."
        as="p"
      />
    </>
  )
}

export default ProductDetails
