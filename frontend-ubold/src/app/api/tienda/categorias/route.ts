import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import wooCommerceClient from '@/lib/woocommerce/client'

export const dynamic = 'force-dynamic'

// Función helper para encontrar el endpoint correcto
async function findCategoriaEndpoint(): Promise<string> {
  const endpoints = ['/api/categorias-producto', '/api/categoria-productos', '/api/categorias']
  
  for (const endpoint of endpoints) {
    try {
      await strapiClient.get<any>(`${endpoint}?pagination[pageSize]=1`)
      return endpoint
    } catch {
      continue
    }
  }
  
  // Si ninguno funciona, usar el primero por defecto
  return endpoints[0]
}

export async function GET(request: NextRequest) {
  try {
    // PROBAR estos nombres en orden hasta encontrar el correcto
    let response: any
    let categoriaEndpoint = '/api/categorias-producto'
    
    try {
      // Intentar primero con /api/categorias-producto
      response = await strapiClient.get<any>(`${categoriaEndpoint}?populate=*&pagination[pageSize]=1000`)
    } catch (error: any) {
      // Si falla, probar con nombre alternativo
      console.log('[API Categorias] Primera URL falló, probando alternativa...')
      try {
        categoriaEndpoint = '/api/categoria-productos'
        response = await strapiClient.get<any>(`${categoriaEndpoint}?populate=*&pagination[pageSize]=1000`)
      } catch (error2: any) {
        // Último intento con categorias
        categoriaEndpoint = '/api/categorias'
        response = await strapiClient.get<any>(`${categoriaEndpoint}?populate=*&pagination[pageSize]=1000`)
      }
    }
    
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
    
    console.log('[API Categorias] ✅ Items obtenidos:', items.length, 'desde:', categoriaEndpoint)
    
    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error: any) {
    console.error('[API Categorias] ❌ Error:', error.message)
    
    // En lugar de devolver error 500, devolver array vacío
    return NextResponse.json({
      success: true,
      data: [],
      warning: `No se pudieron cargar las categorías: ${error.message}`
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[API Categorias POST] 📝 Creando categoría:', body)

    // Validar nombre obligatorio
    if (!body.data?.name && !body.data?.nombre) {
      return NextResponse.json({
        success: false,
        error: 'El nombre de la categoría es obligatorio'
      }, { status: 400 })
    }

    const nombre = body.data.name || body.data.nombre
    const categoriaEndpoint = await findCategoriaEndpoint()
    console.log('[API Categorias POST] Usando endpoint Strapi:', categoriaEndpoint)

    // Crear en Strapi PRIMERO para obtener el documentId
    console.log('[API Categorias POST] 📚 Creando categoría en Strapi primero...')
    
    const categoriaData: any = {
      data: {
        name: nombre.trim(),
        descripcion: body.data.descripcion || null,
        imagen: body.data.imagen || null,
      }
    }

    const strapiCategory = await strapiClient.post<any>(categoriaEndpoint, categoriaData)
    const documentId = strapiCategory.data?.documentId || strapiCategory.documentId
    
    if (!documentId) {
      throw new Error('No se pudo obtener documentId de Strapi')
    }

    console.log('[API Categorias POST] ✅ Categoría creada en Strapi con documentId:', documentId)

    // Crear en WooCommerce con slug=documentId
    console.log('[API Categorias POST] 🛒 Creando categoría en WooCommerce...')
    try {
      const wooCommerceCategory = await wooCommerceClient.post('products/categories', {
        name: nombre.trim(),
        slug: documentId, // Usar documentId como slug
      })

      const wooCommerceId = String(wooCommerceCategory.id)
      console.log('[API Categorias POST] ✅ Categoría creada en WooCommerce con ID:', wooCommerceId)

      // Actualizar Strapi con woocommerce_id
      const updateEndpoint = `${categoriaEndpoint}/${documentId}`
      await strapiClient.put(updateEndpoint, {
        data: {
          woocommerce_id: wooCommerceId
        }
      })

      console.log('[API Categorias POST] ✅ Strapi actualizado con woocommerce_id:', wooCommerceId)

      return NextResponse.json({
        success: true,
        data: {
          strapi: strapiCategory.data || strapiCategory,
          woocommerce: wooCommerceCategory,
        },
        message: 'Categoría creada exitosamente en Strapi y WooCommerce'
      })
    } catch (wooError: any) {
      console.error('[API Categorias POST] ❌ Error al crear en WooCommerce:', wooError.message)
      
      // Eliminar de Strapi si falla WooCommerce
      try {
        const deleteEndpoint = `${categoriaEndpoint}/${documentId}`
        await strapiClient.delete(deleteEndpoint)
        console.log('[API Categorias POST] 🗑️ Categoría eliminada de Strapi debido a error en WooCommerce')
      } catch (deleteError: any) {
        console.error('[API Categorias POST] ⚠️ Error al eliminar de Strapi:', deleteError.message)
      }

      return NextResponse.json({
        success: false,
        error: `Error al crear en WooCommerce: ${wooError.message}`,
        details: 'La categoría fue eliminada de Strapi debido al error'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[API Categorias POST] ❌ Error:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al crear la categoría'
    }, { status: error.status || 500 })
  }
}

