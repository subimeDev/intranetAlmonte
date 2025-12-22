import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import wooCommerceClient from '@/lib/woocommerce/client'

export const dynamic = 'force-dynamic'

// Función helper para obtener el ID del atributo "pa_coleccion" en WooCommerce
async function getColeccionAttributeId(): Promise<number | null> {
  try {
    // Buscar atributo por slug "pa_coleccion" o "coleccion"
    const attributes = await wooCommerceClient.get<any[]>('products/attributes', { slug: 'pa_coleccion' })
    
    if (attributes && attributes.length > 0) {
      return attributes[0].id
    }
    
    // Si no se encuentra por slug, buscar por nombre
    const allAttributes = await wooCommerceClient.get<any[]>('products/attributes')
    const coleccionAttribute = allAttributes.find((attr: any) => 
      attr.slug === 'pa_coleccion' || 
      attr.slug === 'coleccion' ||
      attr.name?.toLowerCase().includes('coleccion') ||
      attr.name?.toLowerCase().includes('collection')
    )
    
    if (coleccionAttribute) {
      return coleccionAttribute.id
    }
    
    console.warn('[API Coleccion] ⚠️ No se encontró el atributo "pa_coleccion" en WooCommerce')
    return null
  } catch (error: any) {
    console.error('[API Coleccion] ❌ Error al obtener ID del atributo:', error.message)
    return null
  }
}

// Función helper para detectar el endpoint correcto de Strapi para colecciones
async function getColeccionEndpoint(): Promise<string> {
  const endpoints = ['/api/colecciones', '/api/serie-coleccions', '/api/colecciones-series']
  
  for (const endpoint of endpoints) {
    try {
      await strapiClient.get<any>(`${endpoint}?pagination[pageSize]=1`)
      console.log('[API Coleccion] ✅ Endpoint encontrado:', endpoint)
      return endpoint
    } catch (error) {
      // Continuar con el siguiente endpoint
    }
  }
  
  // Por defecto usar el primero
  console.warn('[API Coleccion] ⚠️ No se pudo verificar endpoint, usando /api/colecciones por defecto')
  return '/api/colecciones'
}

export async function GET(request: NextRequest) {
  try {
    const coleccionEndpoint = await getColeccionEndpoint()
    const response = await strapiClient.get<any>(`${coleccionEndpoint}?populate=*&pagination[pageSize]=1000`)
    
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
    
    console.log('[API GET coleccion] ✅ Items obtenidos:', items.length, 'desde:', coleccionEndpoint)
    
    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error: any) {
    console.error('[API GET coleccion] ❌ Error:', error.message)
    
    // En lugar de devolver error 500, devolver array vacío
    return NextResponse.json({
      success: true,
      data: [],
      warning: `No se pudieron cargar las colecciones: ${error.message}`
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[API Coleccion POST] 📝 Creando coleccion:', body)

    // Validar campos obligatorios - asumiendo que tiene "nombre" o "titulo"
    const nombreColeccion = body.data?.nombre || body.data?.titulo || body.data?.name || body.data?.title
    if (!nombreColeccion) {
      return NextResponse.json({
        success: false,
        error: 'El nombre de la colección es obligatorio'
      }, { status: 400 })
    }

    const coleccionEndpoint = await getColeccionEndpoint()
    console.log('[API Coleccion POST] Usando endpoint Strapi:', coleccionEndpoint)

    // Crear en Strapi PRIMERO para obtener el documentId
    // El documentId se usará como slug en WooCommerce para hacer el match
    console.log('[API Coleccion POST] 📚 Creando coleccion en Strapi primero...')
    
    // Preparar datos para Strapi - intentar con diferentes campos comunes
    const coleccionData: any = {
      data: {}
    }

    // Intentar con diferentes campos de nombre según el schema
    if (body.data.nombre) coleccionData.data.nombre = body.data.nombre.trim()
    if (body.data.titulo) coleccionData.data.titulo = body.data.titulo.trim()
    if (body.data.name) coleccionData.data.name = body.data.name.trim()
    if (body.data.title) coleccionData.data.title = body.data.title.trim()
    
    // Si no se encontró ningún campo de nombre, usar el primero disponible
    if (Object.keys(coleccionData.data).length === 0) {
      const firstKey = Object.keys(body.data)[0]
      if (firstKey) {
        coleccionData.data[firstKey] = nombreColeccion.trim()
      }
    }

    // Campos opcionales comunes
    if (body.data.descripcion !== undefined) coleccionData.data.descripcion = body.data.descripcion?.trim() || null
    if (body.data.description !== undefined) coleccionData.data.description = body.data.description?.trim() || null

    // Media: imagen o logo
    if (body.data.imagen) coleccionData.data.imagen = body.data.imagen
    if (body.data.logo) coleccionData.data.logo = body.data.logo

    // Relaciones comunes (si existen)
    if (body.data.sello) coleccionData.data.sello = body.data.sello
    if (body.data.editorial) coleccionData.data.editorial = body.data.editorial

    const strapiColeccion = await strapiClient.post<any>(coleccionEndpoint, coleccionData)
    const documentId = strapiColeccion.data?.documentId || strapiColeccion.documentId
    
    if (!documentId) {
      throw new Error('No se pudo obtener el documentId de Strapi')
    }
    
    console.log('[API Coleccion POST] ✅ Coleccion creada en Strapi:', {
      id: strapiColeccion.data?.id || strapiColeccion.id,
      documentId: documentId
    })

    // Obtener el ID del atributo "pa_coleccion" en WooCommerce
    const attributeId = await getColeccionAttributeId()
    
    if (!attributeId) {
      console.warn('[API Coleccion POST] ⚠️ No se pudo obtener el ID del atributo, eliminando de Strapi')
      try {
        await strapiClient.delete<any>(`${coleccionEndpoint}/${documentId}`)
      } catch (deleteError: any) {
        console.error('[API Coleccion POST] ⚠️ Error al eliminar de Strapi:', deleteError.message)
      }
      return NextResponse.json({
        success: false,
        error: 'No se encontró el atributo "pa_coleccion" en WooCommerce. Asegúrate de que existe.'
      }, { status: 400 })
    }

    // Crear término en WooCommerce usando el documentId como slug
    console.log('[API Coleccion POST] 🛒 Creando término en WooCommerce...')
    try {
      const wooCommerceTermData = {
        name: nombreColeccion.trim(),
        slug: documentId, // Usar documentId como slug para sincronización
      }

      const wooCommerceTerm = await wooCommerceClient.post<any>(
        `products/attributes/${attributeId}/terms`,
        wooCommerceTermData
      )

      console.log('[API Coleccion POST] ✅ Término creado en WooCommerce:', {
        id: wooCommerceTerm.id,
        name: wooCommerceTerm.name,
        slug: wooCommerceTerm.slug
      })

      return NextResponse.json({
        success: true,
        data: {
          ...strapiColeccion.data || strapiColeccion,
          woocommerce_term: wooCommerceTerm
        }
      })
    } catch (wooError: any) {
      console.error('[API Coleccion POST] ❌ Error al crear término en WooCommerce:', wooError.message)
      
      // Si el error es que el término ya existe, no es crítico
      if (wooError.message?.includes('term_exists') || wooError.message?.includes('already exists')) {
        console.warn('[API Coleccion POST] ⚠️ El término ya existe en WooCommerce (no crítico)')
        return NextResponse.json({
          success: true,
          data: strapiColeccion.data || strapiColeccion,
          warning: 'La colección ya existe en WooCommerce'
        })
      }

      // Si es otro error, hacer rollback eliminando de Strapi
      console.warn('[API Coleccion POST] ⚠️ Error al crear en WooCommerce, eliminando de Strapi...')
      try {
        await strapiClient.delete<any>(`${coleccionEndpoint}/${documentId}`)
      } catch (deleteError: any) {
        console.error('[API Coleccion POST] ⚠️ Error al eliminar de Strapi:', deleteError.message)
      }

      return NextResponse.json({
        success: false,
        error: `Error al crear en WooCommerce: ${wooError.message}`
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[API Coleccion POST] ❌ ERROR al crear coleccion:', {
      message: error.message,
      status: error.status || 500,
      details: error.details || {}
    })

    return NextResponse.json({
      success: false,
      error: error.message || 'Error al crear la colección',
      details: error.details || {}
    }, { status: error.status || 500 })
  }
}

