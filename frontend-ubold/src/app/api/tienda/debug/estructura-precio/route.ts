import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug Precio] Investigando estructura...')
    
    // Intentar obtener un libro con sus precios populados
    const populateOptions = [
      'populate[precios]=*',
      'populate[PRECIOS]=*',
      'populate[precios][populate]=*',
      'populate=*'
    ]
    
    let libro: any = null
    let precios: any[] = []
    let populateUsado = ''
    
    for (const populate of populateOptions) {
      try {
        console.log(`[Debug Precio] Intentando populate: ${populate}`)
        const response = await strapiClient.get<any>(
          `/api/libros?${populate}&pagination[pageSize]=1`
        )
        
        // Extraer libro
        if (Array.isArray(response)) {
          libro = response[0]
        } else if (response.data && Array.isArray(response.data)) {
          libro = response.data[0]
        } else if (response.data) {
          libro = response.data
        } else {
          libro = response
        }
        
        // Intentar obtener precios
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
          populateUsado = populate
          console.log(`[Debug Precio] ✅ Encontrado con populate: ${populate}`)
          break
        }
      } catch (err: any) {
        console.log(`[Debug Precio] Populate ${populate} falló:`, err.message)
        continue
      }
    }
    
    if (!libro) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo obtener ningún libro',
        populateIntentados: populateOptions
      }, { status: 404 })
    }
    
    const primerPrecio = precios[0]
    
    // Extraer estructura detallada
    let estructuraPrimerPrecio: string[] = []
    let estructuraAttrs: string[] = []
    let ejemploCompleto: any = null
    
    if (primerPrecio) {
      estructuraPrimerPrecio = Object.keys(primerPrecio)
      
      if (primerPrecio.attributes) {
        estructuraAttrs = Object.keys(primerPrecio.attributes)
      }
      
      ejemploCompleto = primerPrecio
    }
    
    // También intentar obtener precios directamente
    let preciosDirectos: any = null
    let errorDirecto = null
    
    try {
      preciosDirectos = await strapiClient.get<any>('/api/precios?populate=*&pagination[pageSize]=3')
      console.log('[Debug Precio] ✅ Endpoint /api/precios funciona')
    } catch (e: any) {
      errorDirecto = e.message
      console.log('[Debug Precio] ❌ Endpoint /api/precios falló:', errorDirecto)
    }
    
    return NextResponse.json({
      success: true,
      populateUsado,
      libro: {
        id: libro.id,
        documentId: libro.documentId,
        nombre: libro.attributes?.nombre_libro || libro.nombre_libro
      },
      precios: {
        total: precios.length,
        estructuraPrimerPrecio,
        estructuraAttrs,
        ejemploCompleto,
        todosLosPrecios: precios.slice(0, 3), // Solo primeros 3
        relacionConLibro: precios.length > 0 ? 'Libro tiene precios relacionados' : 'Libro no tiene precios'
      },
      endpointDirecto: {
        funciona: !errorDirecto,
        error: errorDirecto,
        data: preciosDirectos ? (Array.isArray(preciosDirectos) ? preciosDirectos.slice(0, 2) : (preciosDirectos.data?.slice(0, 2) || [])) : null
      },
      instrucciones: {
        paso1: 'Revisa "precios.estructuraPrimerPrecio" para ver campos del precio',
        paso2: 'Revisa "precios.estructuraAttrs" para ver campos dentro de attributes',
        paso3: 'Revisa "precios.ejemploCompleto" para ver estructura completa',
        paso4: 'Si "endpointDirecto.funciona" es true, puedes usar POST /api/precios',
        paso5: 'Si es false, necesitas crear precios de otra forma (actualizar libro)'
      }
    })
    
  } catch (error: any) {
    console.error('[Debug Precio] ❌ Error general:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

