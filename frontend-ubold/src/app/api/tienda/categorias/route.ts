import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'

export const dynamic = 'force-dynamic'

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
    if (!body.data?.nombre) {
      return NextResponse.json({
        success: false,
        error: 'El nombre de la categoría es obligatorio'
      }, { status: 400 })
    }

    // Crear en Strapi - intentar con diferentes endpoints
    console.log('[API Categorias POST] 📚 Creando categoría en Strapi...')
    
    const categoriaData: any = {
      data: {
        nombre: body.data.nombre.trim(),
        descripcion: body.data.descripcion || null,
        slug: body.data.slug || body.data.nombre.toLowerCase().replace(/\s+/g, '-'),
      },
    }

    // Intentar crear en diferentes endpoints posibles
    let response: any
    let categoriaEndpoint = '/api/categorias-producto'
    
    try {
      response = await strapiClient.post(categoriaEndpoint, categoriaData) as any
    } catch (error: any) {
      try {
        categoriaEndpoint = '/api/categoria-productos'
        response = await strapiClient.post(categoriaEndpoint, categoriaData) as any
      } catch (error2: any) {
        categoriaEndpoint = '/api/categorias'
        response = await strapiClient.post(categoriaEndpoint, categoriaData) as any
      }
    }
    
    console.log('[API Categorias POST] ✅ Categoría creada en Strapi:', response.id || response.documentId)
    
    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('[API Categorias POST] ❌ Error:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al crear la categoría'
    }, { status: 500 })
  }
}

