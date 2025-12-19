import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import wooCommerceClient from '@/lib/woocommerce/client'

export const dynamic = 'force-dynamic'

// Función helper para obtener el ID del atributo "pa_tipo_libro" en WooCommerce
async function getTipoLibroAttributeId(): Promise<number | null> {
  try {
    // Buscar atributo por slug "pa_tipo_libro" o "tipo-libro"
    const attributes = await wooCommerceClient.get<any[]>('products/attributes', { slug: 'pa_tipo_libro' })
    
    if (attributes && attributes.length > 0) {
      return attributes[0].id
    }
    
    // Si no se encuentra por slug, buscar por nombre
    const allAttributes = await wooCommerceClient.get<any[]>('products/attributes')
    const tipoLibroAttribute = allAttributes.find((attr: any) => 
      attr.slug === 'pa_tipo_libro' || 
      attr.slug === 'tipo-libro' ||
      attr.name?.toLowerCase().includes('tipo') && attr.name?.toLowerCase().includes('libro')
    )
    
    if (tipoLibroAttribute) {
      return tipoLibroAttribute.id
    }
    
    console.warn('[API Tipo Libro] ⚠️ No se encontró el atributo "pa_tipo_libro" en WooCommerce')
    return null
  } catch (error: any) {
    console.error('[API Tipo Libro] ❌ Error al obtener ID del atributo:', error.message)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = await strapiClient.get<any>('/api/tipo-libros?populate=*&pagination[pageSize]=1000')
    
    let items: any[] = []
    if (Array.isArray(response)) {
      items = response
    } else if (response.data && Array.isArray(response.data)) {
      items = response.data
    } else if (response.data) {
      items = [response.data]
    } else {
      items = [response]
    }
    
    console.log('[API GET tipo-libro] ✅ Items obtenidos:', items.length)
    
    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error: any) {
    console.error('[API GET tipo-libro] ❌ Error:', error.message)
    
    // En lugar de devolver error 500, devolver array vacío
    return NextResponse.json({
      success: true,
      data: [],
      warning: `No se pudieron cargar los tipos de libro: ${error.message}`
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[API Tipo Libro POST] 📝 Creando tipo libro:', body)

    // Validar campos obligatorios según schema de Strapi
    if (!body.data?.codigo_tipo_libro && !body.data?.codigoTipoLibro && !body.data?.codigo) {
      return NextResponse.json({
        success: false,
        error: 'El código del tipo de libro es obligatorio'
      }, { status: 400 })
    }

    if (!body.data?.nombre_tipo_libro && !body.data?.nombreTipoLibro && !body.data?.nombre) {
      return NextResponse.json({
        success: false,
        error: 'El nombre del tipo de libro es obligatorio'
      }, { status: 400 })
    }

    const codigoTipoLibro = body.data.codigo_tipo_libro || body.data.codigoTipoLibro || body.data.codigo
    const nombreTipoLibro = body.data.nombre_tipo_libro || body.data.nombreTipoLibro || body.data.nombre
    const tipoLibroEndpoint = '/api/tipo-libros'
    console.log('[API Tipo Libro POST] Usando endpoint Strapi:', tipoLibroEndpoint)

    // Crear en Strapi PRIMERO para obtener el documentId
    // El documentId se usará como slug en WooCommerce para hacer el match
    console.log('[API Tipo Libro POST] 📚 Creando tipo libro en Strapi primero...')
    
    // El schema de Strapi para tipo-libro usa: codigo_tipo_libro*, nombre_tipo_libro*, descripcion
    const tipoLibroData: any = {
      data: {
        codigo_tipo_libro: codigoTipoLibro.trim(),
        nombre_tipo_libro: nombreTipoLibro.trim(),
        descripcion: body.data.descripcion || body.data.description || null,
      }
    }

    const strapiTipoLibro = await strapiClient.post<any>(tipoLibroEndpoint, tipoLibroData)
    const documentId = strapiTipoLibro.data?.documentId || strapiTipoLibro.documentId
    
    if (!documentId) {
      throw new Error('No se pudo obtener el documentId de Strapi')
    }
    
    console.log('[API Tipo Libro POST] ✅ Tipo libro creado en Strapi:', {
      id: strapiTipoLibro.data?.id || strapiTipoLibro.id,
      documentId: documentId
    })

    // Obtener el ID del atributo "pa_tipo_libro" en WooCommerce
    const attributeId = await getTipoLibroAttributeId()
    
    if (!attributeId) {
      console.warn('[API Tipo Libro POST] ⚠️ No se pudo obtener el ID del atributo, eliminando de Strapi')
      try {
        await strapiClient.delete<any>(`${tipoLibroEndpoint}/${documentId}`)
      } catch (deleteError: any) {
        console.error('[API Tipo Libro POST] ⚠️ Error al eliminar de Strapi:', deleteError.message)
      }
      return NextResponse.json({
        success: false,
        error: 'No se encontró el atributo "pa_tipo_libro" en WooCommerce. Verifica que el atributo esté configurado.'
      }, { status: 400 })
    }

    // Crear término del atributo en WooCommerce usando el documentId como slug
    // IMPORTANTE: Siempre usar documentId como slug para poder hacer match después
    console.log('[API Tipo Libro POST] 🛒 Creando término en WooCommerce con slug=documentId...')
    
    const wooCommerceTermData: any = {
      name: nombreTipoLibro.trim(),
      description: body.data.descripcion || body.data.description || '',
      slug: documentId.toString(), // SIEMPRE usar documentId como slug para el match
    }

    // Crear término en WooCommerce
    let wooCommerceTerm = null
    try {
      const wooResponse = await wooCommerceClient.post<any>(
        `products/attributes/${attributeId}/terms`,
        wooCommerceTermData
      )
      
      // La respuesta puede venir directamente o dentro de .data
      wooCommerceTerm = wooResponse?.data || wooResponse
      
      console.log('[API Tipo Libro POST] ✅ Término creado en WooCommerce:', {
        id: wooCommerceTerm?.id,
        name: wooCommerceTerm?.name,
        slug: wooCommerceTerm?.slug,
        response: wooResponse
      })

      if (!wooCommerceTerm || !wooCommerceTerm.id) {
        throw new Error('La respuesta de WooCommerce no contiene un término válido')
      }

      // No guardamos woocommerce_id en Strapi porque no existe en el schema
      // El match se hace usando documentId como slug en WooCommerce
      console.log('[API Tipo Libro POST] ✅ Término creado en WooCommerce, match por documentId:', documentId)
    } catch (wooError: any) {
      // Manejar caso especial: término ya existe en WooCommerce
      if (wooError.code === 'term_exists' && wooError.details?.data?.resource_id) {
        const existingTermId = wooError.details.data.resource_id
        console.log('[API Tipo Libro POST] 🔄 Término ya existe en WooCommerce, obteniendo término existente:', existingTermId)
        
        try {
          // Obtener el término existente de WooCommerce
          wooCommerceTerm = await wooCommerceClient.get<any>(`products/attributes/${attributeId}/terms/${existingTermId}`)
          console.log('[API Tipo Libro POST] ✅ Término existente obtenido de WooCommerce:', {
            id: wooCommerceTerm.id,
            name: wooCommerceTerm.name,
            slug: wooCommerceTerm.slug
          })

          // No guardamos woocommerce_id en Strapi porque no existe en el schema
          // El match se hace usando documentId como slug en WooCommerce
          console.log('[API Tipo Libro POST] ✅ Término existente encontrado en WooCommerce, match por documentId:', documentId)
        } catch (getError: any) {
          console.error('[API Tipo Libro POST] ❌ Error al obtener término existente de WooCommerce:', getError.message)
          // Si falla al obtener el término existente, eliminar de Strapi
          try {
            await strapiClient.delete<any>(`${tipoLibroEndpoint}/${documentId}`)
            console.log('[API Tipo Libro POST] 🗑️ Tipo libro eliminado de Strapi debido a error al obtener término existente')
          } catch (deleteError: any) {
            console.error('[API Tipo Libro POST] ⚠️ Error al eliminar de Strapi:', deleteError.message)
          }
          throw getError
        }
      } else {
        // Para otros errores, eliminar de Strapi para mantener consistencia
        console.error('[API Tipo Libro POST] ⚠️ Error al crear término en WooCommerce:', wooError.message)
        try {
          await strapiClient.delete<any>(`${tipoLibroEndpoint}/${documentId}`)
          console.log('[API Tipo Libro POST] 🗑️ Tipo libro eliminado de Strapi debido a error en WooCommerce')
        } catch (deleteError: any) {
          console.error('[API Tipo Libro POST] ⚠️ Error al eliminar de Strapi:', deleteError.message)
        }
        throw wooError
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        woocommerce: wooCommerceTerm,
        strapi: strapiTipoLibro.data || strapiTipoLibro,
      },
      message: 'Tipo de libro creado exitosamente en Strapi y WooCommerce'
    })

  } catch (error: any) {
    console.error('[API Tipo Libro POST] ❌ ERROR al crear tipo libro:', {
      message: error.message,
      status: error.status,
      details: error.details,
    })
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al crear el tipo de libro',
      details: error.details
    }, { status: error.status || 500 })
  }
}

