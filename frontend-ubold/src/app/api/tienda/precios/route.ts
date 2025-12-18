import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'

export const dynamic = 'force-dynamic'

// GET - Obtener precios de un libro
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const libroId = searchParams.get('libro')
    
    if (!libroId) {
      return NextResponse.json({
        success: false,
        error: 'ID de libro requerido'
      }, { status: 400 })
    }
    
    console.log('[API Precios GET] Obteniendo precios para libro:', libroId)
    
    // Buscar libro con sus precios usando diferentes variaciones de populate
    const populateOptions = [
      'populate[precios]=*',
      'populate[PRECIOS]=*',
      'populate[precios][populate]=*',
      'populate=*'
    ]
    
    let libro: any = null
    let precios: any[] = []
    
    for (const populate of populateOptions) {
      try {
        const response = await strapiClient.get<any>(
          `/api/libros?filters[id][$eq]=${libroId}&${populate}`
        )
        
        // Extraer libro de la respuesta
        if (Array.isArray(response)) {
          libro = response[0]
        } else if (response.data && Array.isArray(response.data)) {
          libro = response.data[0]
        } else if (response.data) {
          libro = response.data
        } else {
          libro = response
        }
        
        // Intentar obtener precios de diferentes formas
        const attrs = libro?.attributes || {}
        precios = 
          attrs.precios?.data || 
          attrs.PRECIOS?.data || 
          libro.precios?.data || 
          libro.PRECIOS?.data ||
          attrs.precios ||
          attrs.PRECIOS ||
          libro.precios ||
          libro.PRECIOS ||
          []
        
        if (precios.length > 0 || libro) {
          console.log(`[API Precios GET] ✅ Encontrado con populate: ${populate}`)
          break
        }
      } catch (err: any) {
        console.log(`[API Precios GET] Populate ${populate} falló:`, err.message)
        continue
      }
    }
    
    if (!libro) {
      return NextResponse.json({
        success: false,
        error: 'Libro no encontrado'
      }, { status: 404 })
    }
    
    console.log('[API Precios GET] ✅ Precios encontrados:', precios.length)
    
    return NextResponse.json({
      success: true,
      data: Array.isArray(precios) ? precios : [],
      libro: {
        id: libro.id,
        nombre: libro.attributes?.nombre_libro || libro.nombre_libro
      }
    })
    
  } catch (error: any) {
    console.error('[API Precios GET] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST - Crear nuevo precio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[API Precios POST] 📦 Body recibido:', body)
    console.log('[API Precios POST] 🔑 Keys originales:', Object.keys(body))

    // Validaciones
    if (!body.monto || parseFloat(body.monto) <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Monto es requerido y debe ser mayor a 0'
      }, { status: 400 })
    }

    if (!body.libroId) {
      return NextResponse.json({
        success: false,
        error: 'ID de libro es requerido'
      }, { status: 400 })
    }

    // Obtener el libro para obtener su documentId
    console.log('[API Precios POST] Obteniendo libro:', body.libroId)
    
    const libroResponse = await strapiClient.get<any>(
      `/api/libros?filters[id][$eq]=${body.libroId}`
    )
    
    let libro: any
    if (Array.isArray(libroResponse)) {
      libro = libroResponse[0]
    } else if (libroResponse.data && Array.isArray(libroResponse.data)) {
      libro = libroResponse.data[0]
    } else if (libroResponse.data) {
      libro = libroResponse.data
    } else {
      libro = libroResponse
    }
    
    if (!libro || !libro.documentId) {
      throw new Error('Libro no encontrado')
    }
    
    console.log('[API Precios POST] ✅ Libro encontrado:', {
      id: libro.id,
      documentId: libro.documentId
    })
    
    // CRÍTICO: Preparar datos en minúsculas SOLO
    const precioData: any = {
      data: {
        precio: parseFloat(body.monto),  // minúsculas
        libro: libro.documentId,          // minúsculas
      }
    }
    
    // Agregar otros campos si vienen en el body (solo minúsculas)
    if (body.canal) precioData.data.canal = body.canal
    if (body.moneda) precioData.data.moneda = body.moneda
    if (body.fechaInicio) precioData.data.fecha_inicio = body.fechaInicio
    if (body.fechaFin) precioData.data.fecha_fin = body.fechaFin
    if (body.tipo) precioData.data.tipo = body.tipo
    
    // VERIFICACIÓN: Asegurar que NO hay mayúsculas
    const keys = Object.keys(precioData.data)
    const hasUppercase = keys.some(k => k !== k.toLowerCase())
    
    if (hasUppercase) {
      console.error('[API Precios POST] 🚨 ERROR: Hay mayúsculas en keys!')
      console.error('[API Precios POST] Keys:', keys)
      
      // Normalizar forzadamente
      const normalized: any = {}
      for (const [key, value] of Object.entries(precioData.data)) {
        normalized[key.toLowerCase()] = value
      }
      precioData.data = normalized
      console.log('[API Precios POST] ✅ Normalizado:', Object.keys(precioData.data))
    }
    
    console.log('[API Precios POST] 📤 Datos finales:', JSON.stringify(precioData, null, 2))
    
    // Intentar crear en Strapi
    try {
      const response = await strapiClient.post<any>('/api/precios', precioData)
      
      console.log('[API Precios POST] ✅ Precio creado')
      
      return NextResponse.json({
        success: true,
        data: response.data || response
      })
      
    } catch (strapiError: any) {
      console.error('[API Precios POST] ❌ Error de Strapi:', strapiError)
      
      // Si es 405, explicar el problema
      if (strapiError.status === 405) {
        return NextResponse.json({
          success: false,
          error: 'La colección "precios" no acepta creación directa. Necesitas configurar los permisos en Strapi o usar otro método.',
          ayuda: 'Ve a Strapi → Settings → Users & Permissions → Roles → Public/Authenticated → Permissions → Precio → Marca "create"'
        }, { status: 400 })
      }
      
      throw strapiError
    }
    
  } catch (error: any) {
    console.error('[API Precios POST] ❌ ERROR:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al crear precio',
      details: error.details
    }, { status: 500 })
  }
}

