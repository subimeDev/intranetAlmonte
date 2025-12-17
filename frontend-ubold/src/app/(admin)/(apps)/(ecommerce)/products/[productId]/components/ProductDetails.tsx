'use client'

import { Badge, Col, Row, Alert } from 'react-bootstrap'
import { format } from 'date-fns'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

  const isPublished = !!(attrs.publishedAt || producto.publishedAt)
  const createdAt = attrs.createdAt || producto.createdAt || new Date().toISOString()
  const createdDate = new Date(createdAt)
  
  // Obtener el ID correcto: preferir id numérico, luego documentId, luego el id de la URL
  // El ID numérico es el que usa Strapi para las actualizaciones
  const productId = producto.id?.toString() || producto.documentId || 'unknown'
  
  console.log('[ProductDetails] ID del producto:', {
    productoId: productId,
    tieneId: !!producto.id,
    tieneDocumentId: !!producto.documentId,
    idValue: producto.id,
    documentIdValue: producto.documentId,
  })

  const handleSaveNombre = async (newValue: string) => {
    setSavingField('nombre')
    setError(null)

    try {
      const response = await fetch(`/api/tienda/productos/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_libro: newValue,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar nombre')
      }

      // Recargar la página para mostrar los cambios
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error al guardar nombre')
      console.error('Error al guardar nombre:', err)
      throw err // Re-lanzar para que EditableField muestre el error
    } finally {
      setSavingField(null)
    }
  }

  const handleSaveDescripcion = async (newValue: string) => {
    setSavingField('descripcion')
    setError(null)

    try {
      const response = await fetch(`/api/tienda/productos/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descripcion: newValue,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al guardar descripción')
      }

      // Recargar la página para mostrar los cambios
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error al guardar descripción')
      console.error('Error al guardar descripción:', err)
      throw err // Re-lanzar para que EditableField muestre el error
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

      {precioMinimo > 0 && (
        <h3 className="text-muted d-flex align-items-center gap-2 mb-4">
          <span className="fw-bold text-danger">${precioMinimo.toFixed(2)}</span>
        </h3>
      )}

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
