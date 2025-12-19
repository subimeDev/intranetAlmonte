import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import wooCommerceClient from '@/lib/woocommerce/client'

export const dynamic = 'force-dynamic'

// Función helper para obtener el ID del atributo "pa_tipo_libro" en WooCommerce
async function getTipoLibroAttributeId(): Promise<number | null> {
  try {
    const attributes = await wooCommerceClient.get<any[]>('products/attributes', { slug: 'pa_tipo_libro' })
    
    if (attributes && attributes.length > 0) {
      return attributes[0].id
    }
    
    const allAttributes = await wooCommerceClient.get<any[]>('products/attributes')
    const tipoLibroAttribute = allAttributes.find((attr: any) => 
      attr.slug === 'pa_tipo_libro' || 
      attr.slug === 'tipo-libro' ||
      attr.name?.toLowerCase().includes('tipo') && attr.name?.toLowerCase().includes('libro')
    )
    
    if (tipoLibroAttribute) {
      return tipoLibroAttribute.id
    }
    
    return null
  } catch (error: any) {
    console.error('[API Tipo Libro] ❌ Error al obtener ID del atributo:', error.message)
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('[API /tienda/tipo-libro/[id] GET] Obteniendo tipo libro:', {
      id,
      esNumerico: !isNaN(parseInt(id)),
    })
    
    const tipoLibroEndpoint = '/api/tipo-libros'
    
    // PASO 1: Intentar con filtro si es numérico
    if (!isNaN(parseInt(id))) {
      try {
        const filteredResponse = await strapiClient.get<any>(
          `${tipoLibroEndpoint}?filters[id][$eq]=${id}&populate=*`
        )
        
        let tipoLibro: any
        if (Array.isArray(filteredResponse)) {
          tipoLibro = filteredResponse[0]
        } else if (filteredResponse.data && Array.isArray(filteredResponse.data)) {
          tipoLibro = filteredResponse.data[0]
        } else if (filteredResponse.data) {
          tipoLibro = filteredResponse.data
        } else {
          tipoLibro = filteredResponse
        }
        
        if (tipoLibro && (tipoLibro.id || tipoLibro.documentId)) {
          console.log('[API /tienda/tipo-libro/[id] GET] ✅ Tipo libro encontrado con filtro')
          return NextResponse.json({
            success: true,
            data: tipoLibro
          }, { status: 200 })
        }
      } catch (filterError: any) {
        console.warn('[API /tienda/tipo-libro/[id] GET] ⚠️ Error al obtener con filtro:', filterError.message)
      }
    }
    
    // PASO 2: Buscar en lista completa
    try {
      const allTipoLibros = await strapiClient.get<any>(
        `${tipoLibroEndpoint}?populate=*&pagination[pageSize]=1000`
      )
      
      let tipoLibros: any[] = []
      
      if (Array.isArray(allTipoLibros)) {
        tipoLibros = allTipoLibros
      } else if (Array.isArray(allTipoLibros.data)) {
        tipoLibros = allTipoLibros.data
      } else if (allTipoLibros.data && Array.isArray(allTipoLibros.data.data)) {
        tipoLibros = allTipoLibros.data.data
      } else if (allTipoLibros.data && !Array.isArray(allTipoLibros.data)) {
        tipoLibros = [allTipoLibros.data]
      }
      
      const tipoLibroEncontrado = tipoLibros.find((tl: any) => {
        const tlReal = tl.attributes && Object.keys(tl.attributes).length > 0 ? tl.attributes : tl
        
        const tlId = tlReal.id?.toString() || tl.id?.toString()
        const tlDocId = tlReal.documentId?.toString() || tl.documentId?.toString()
        const idStr = id.toString()
        const idNum = parseInt(idStr)
        
        return (
          tlId === idStr ||
          tlDocId === idStr ||
          (!isNaN(idNum) && (tlReal.id === idNum || tl.id === idNum))
        )
      })
      
      if (tipoLibroEncontrado) {
        console.log('[API /tienda/tipo-libro/[id] GET] ✅ Tipo libro encontrado en lista completa')
        return NextResponse.json({
          success: true,
          data: tipoLibroEncontrado
        }, { status: 200 })
      }
    } catch (listError: any) {
      console.warn('[API /tienda/tipo-libro/[id] GET] ⚠️ Error al buscar en lista completa:', listError.message)
    }
    
    // PASO 3: Intentar endpoint directo
    try {
      const response = await strapiClient.get<any>(`${tipoLibroEndpoint}/${id}?populate=*`)
      
      let tipoLibro: any
      if (response.data) {
        tipoLibro = response.data
      } else {
        tipoLibro = response
      }
      
      if (tipoLibro) {
        console.log('[API /tienda/tipo-libro/[id] GET] ✅ Tipo libro encontrado con endpoint directo')
        return NextResponse.json({
          success: true,
          data: tipoLibro
        }, { status: 200 })
      }
    } catch (directError: any) {
      console.error('[API /tienda/tipo-libro/[id] GET] ❌ Error al obtener tipo libro:', directError.message)
    }
    
    return NextResponse.json({
      success: false,
      error: 'Tipo de libro no encontrado',
    }, { status: 404 })
    
  } catch (error: any) {
    console.error('[API /tienda/tipo-libro/[id] GET] ❌ Error general:', error.message)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener tipo de libro',
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[API Tipo Libro DELETE] 🗑️ Eliminando tipo libro:', id)

    const tipoLibroEndpoint = '/api/tipo-libros'
    
    // Primero obtener el tipo libro de Strapi para obtener el documentId
    let documentId: string | null = null
    try {
      const tipoLibroResponse = await strapiClient.get<any>(`${tipoLibroEndpoint}?filters[id][$eq]=${id}&populate=*`)
      let tipoLibros: any[] = []
      if (Array.isArray(tipoLibroResponse)) {
        tipoLibros = tipoLibroResponse
      } else if (tipoLibroResponse.data && Array.isArray(tipoLibroResponse.data)) {
        tipoLibros = tipoLibroResponse.data
      } else if (tipoLibroResponse.data) {
        tipoLibros = [tipoLibroResponse.data]
      }
      const tipoLibroStrapi = tipoLibros[0]
      documentId = tipoLibroStrapi?.documentId || tipoLibroStrapi?.data?.documentId || id
    } catch (error: any) {
      console.warn('[API Tipo Libro DELETE] ⚠️ No se pudo obtener tipo libro de Strapi:', error.message)
      documentId = id
    }

    // Obtener el ID del atributo
    const attributeId = await getTipoLibroAttributeId()

    // Buscar en WooCommerce por slug (documentId) - no guardamos woocommerce_id en Strapi
    let woocommerceId: string | null = null
    if (documentId && attributeId) {
      try {
        console.log('[API Tipo Libro DELETE] 🔍 Buscando término en WooCommerce por slug:', documentId)
        const wcTerms = await wooCommerceClient.get<any[]>(
          `products/attributes/${attributeId}/terms`,
          { slug: documentId.toString() }
        )
        if (wcTerms && wcTerms.length > 0) {
          woocommerceId = wcTerms[0].id.toString()
          console.log('[API Tipo Libro DELETE] ✅ Término encontrado en WooCommerce por slug:', woocommerceId)
        }
      } catch (searchError: any) {
        console.warn('[API Tipo Libro DELETE] ⚠️ No se pudo buscar por slug en WooCommerce:', searchError.message)
      }
    }

    // Eliminar en WooCommerce primero si tenemos el ID
    let wooCommerceDeleted = false
    if (woocommerceId && attributeId) {
      try {
        console.log('[API Tipo Libro DELETE] 🛒 Eliminando término en WooCommerce:', woocommerceId)
        await wooCommerceClient.delete<any>(`products/attributes/${attributeId}/terms/${woocommerceId}`, true)
        wooCommerceDeleted = true
        console.log('[API Tipo Libro DELETE] ✅ Término eliminado en WooCommerce')
      } catch (wooError: any) {
        console.error('[API Tipo Libro DELETE] ⚠️ Error al eliminar en WooCommerce (no crítico):', wooError.message)
      }
    }

    // Eliminar en Strapi usando documentId si está disponible
    const strapiEndpoint = documentId ? `${tipoLibroEndpoint}/${documentId}` : `${tipoLibroEndpoint}/${id}`
    console.log('[API Tipo Libro DELETE] Usando endpoint Strapi:', strapiEndpoint, { documentId, id })

    const response = await strapiClient.delete<any>(strapiEndpoint)
    console.log('[API Tipo Libro DELETE] ✅ Tipo libro eliminado en Strapi')

    return NextResponse.json({
      success: true,
      message: 'Tipo de libro eliminado exitosamente' + (wooCommerceDeleted ? ' en WooCommerce y Strapi' : ' en Strapi'),
      data: response
    })

  } catch (error: any) {
    console.error('[API Tipo Libro DELETE] ❌ ERROR al eliminar tipo libro:', {
      message: error.message,
      status: error.status,
      details: error.details,
    })
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al eliminar el tipo de libro',
      details: error.details
    }, { status: error.status || 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('[API Tipo Libro PUT] ✏️ Actualizando tipo libro:', id, body)

    const tipoLibroEndpoint = '/api/tipo-libros'
    
    // Primero obtener el tipo libro de Strapi para obtener el documentId
    let tipoLibroStrapi: any
    let documentId: string | null = null
    try {
      const tipoLibroResponse = await strapiClient.get<any>(`${tipoLibroEndpoint}?filters[id][$eq]=${id}&populate=*`)
      let tipoLibros: any[] = []
      if (Array.isArray(tipoLibroResponse)) {
        tipoLibros = tipoLibroResponse
      } else if (tipoLibroResponse.data && Array.isArray(tipoLibroResponse.data)) {
        tipoLibros = tipoLibroResponse.data
      } else if (tipoLibroResponse.data) {
        tipoLibros = [tipoLibroResponse.data]
      }
      tipoLibroStrapi = tipoLibros[0]
      documentId = tipoLibroStrapi?.documentId || tipoLibroStrapi?.data?.documentId || id
    } catch (error: any) {
      console.warn('[API Tipo Libro PUT] ⚠️ No se pudo obtener tipo libro de Strapi:', error.message)
      documentId = id
    }

    // Obtener el ID del atributo
    const attributeId = await getTipoLibroAttributeId()

    // Buscar en WooCommerce por slug (documentId) - no guardamos woocommerce_id en Strapi
    let woocommerceId: string | null = null
    if (documentId && attributeId) {
      // Buscar por slug (documentId) en WooCommerce
      try {
        console.log('[API Tipo Libro PUT] 🔍 Buscando término en WooCommerce por slug:', documentId)
        const wcTerms = await wooCommerceClient.get<any[]>(
          `products/attributes/${attributeId}/terms`,
          { slug: documentId.toString() }
        )
        if (wcTerms && wcTerms.length > 0) {
          woocommerceId = wcTerms[0].id.toString()
          console.log('[API Tipo Libro PUT] ✅ Término encontrado en WooCommerce por slug:', woocommerceId)
        }
      } catch (searchError: any) {
        console.warn('[API Tipo Libro PUT] ⚠️ No se pudo buscar por slug en WooCommerce:', searchError.message)
      }
    }

    // Actualizar en WooCommerce primero si tenemos el ID
    let wooCommerceTerm = null
    if (woocommerceId && attributeId) {
      try {
        console.log('[API Tipo Libro PUT] 🛒 Actualizando término en WooCommerce:', woocommerceId)
        
        const wooCommerceTermData: any = {}
        if (body.data.nombre_tipo_libro || body.data.nombreTipoLibro || body.data.nombre) {
          wooCommerceTermData.name = (body.data.nombre_tipo_libro || body.data.nombreTipoLibro || body.data.nombre).trim()
        }
        if (body.data.descripcion !== undefined || body.data.description !== undefined) {
          wooCommerceTermData.description = body.data.descripcion || body.data.description || ''
        }

        wooCommerceTerm = await wooCommerceClient.put<any>(
          `products/attributes/${attributeId}/terms/${woocommerceId}`,
          wooCommerceTermData
        )
        console.log('[API Tipo Libro PUT] ✅ Término actualizado en WooCommerce')
      } catch (wooError: any) {
        console.error('[API Tipo Libro PUT] ⚠️ Error al actualizar en WooCommerce (no crítico):', wooError.message)
      }
    }

    // Actualizar en Strapi usando documentId si está disponible
    const strapiEndpoint = documentId ? `${tipoLibroEndpoint}/${documentId}` : `${tipoLibroEndpoint}/${id}`
    console.log('[API Tipo Libro PUT] Usando endpoint Strapi:', strapiEndpoint, { documentId, id })

    // El schema de Strapi para tipo-libro usa: codigo_tipo_libro*, nombre_tipo_libro*, descripcion
    const tipoLibroData: any = {
      data: {}
    }

    // Aceptar diferentes formatos del formulario pero guardar según schema real
    if (body.data.codigo_tipo_libro) tipoLibroData.data.codigo_tipo_libro = body.data.codigo_tipo_libro.trim()
    if (body.data.codigoTipoLibro) tipoLibroData.data.codigo_tipo_libro = body.data.codigoTipoLibro.trim()
    if (body.data.codigo) tipoLibroData.data.codigo_tipo_libro = body.data.codigo.trim()
    
    if (body.data.nombre_tipo_libro) tipoLibroData.data.nombre_tipo_libro = body.data.nombre_tipo_libro.trim()
    if (body.data.nombreTipoLibro) tipoLibroData.data.nombre_tipo_libro = body.data.nombreTipoLibro.trim()
    if (body.data.nombre) tipoLibroData.data.nombre_tipo_libro = body.data.nombre.trim()
    
    if (body.data.descripcion !== undefined) tipoLibroData.data.descripcion = body.data.descripcion || null
    if (body.data.description !== undefined) tipoLibroData.data.descripcion = body.data.description || null

    // No guardamos woocommerce_id en Strapi porque no existe en el schema
    // El match se hace usando documentId como slug en WooCommerce

    const strapiResponse = await strapiClient.put<any>(strapiEndpoint, tipoLibroData)
    console.log('[API Tipo Libro PUT] ✅ Tipo libro actualizado en Strapi')

    return NextResponse.json({
      success: true,
      data: {
        woocommerce: wooCommerceTerm,
        strapi: strapiResponse.data || strapiResponse,
      },
      message: 'Tipo de libro actualizado exitosamente' + (wooCommerceTerm ? ' en WooCommerce y Strapi' : ' en Strapi')
    })

  } catch (error: any) {
    console.error('[API Tipo Libro PUT] ❌ ERROR al actualizar tipo libro:', {
      message: error.message,
      status: error.status,
      details: error.details,
    })
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al actualizar el tipo de libro',
      details: error.details
    }, { status: error.status || 500 })
  }
}

