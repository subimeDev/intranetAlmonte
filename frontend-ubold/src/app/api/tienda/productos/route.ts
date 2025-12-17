/**
 * API Route para obtener productos desde Strapi
 * Esto evita exponer el token de Strapi en el cliente
 */

import { NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import type { StrapiResponse, StrapiEntity } from '@/lib/strapi/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verificar que el token esté configurado
    const token = process.env.STRAPI_API_TOKEN
    if (!token) {
      console.error('[API /tienda/productos] STRAPI_API_TOKEN no está configurado')
      return NextResponse.json(
        { 
          success: false,
          error: 'STRAPI_API_TOKEN no está configurado. Verifica las variables de entorno.',
          data: [],
          meta: {},
        },
        { status: 500 }
      )
    }

    // Endpoint correcto confirmado: /api/libros (verificado en test-strapi)
    const endpointUsed = '/api/libros'
    const url = `${process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.moraleja.cl'}${endpointUsed}?populate=*&pagination[pageSize]=100`
    
    console.log('[API /tienda/productos] Intentando obtener productos:', {
      endpoint: endpointUsed,
      url: url.replace(/Bearer\s+\w+/, 'Bearer [TOKEN]'), // Ocultar token en logs
      tieneToken: !!token,
    })
    
    // Usar populate=* que funciona correctamente
    // Solo especificar campos que realmente existen en Strapi (en minúsculas)
    const response = await strapiClient.get<any>(
      `${endpointUsed}?populate=*&pagination[pageSize]=100`
    )
    
    // Log detallado para debugging
    console.log('[API /tienda/productos] Respuesta de Strapi exitosa:', {
      endpoint: endpointUsed,
      hasData: !!response.data,
      isArray: Array.isArray(response.data),
      count: Array.isArray(response.data) ? response.data.length : response.data ? 1 : 0,
    })
    
    // Log del primer producto para verificar estructura de imágenes
    if (response.data && (Array.isArray(response.data) ? response.data[0] : response.data)) {
      const primerProducto = Array.isArray(response.data) ? response.data[0] : response.data
      console.log('[API /tienda/productos] Primer producto estructura:', {
        id: primerProducto.id,
        tieneAttributes: !!primerProducto.attributes,
        keysAttributes: primerProducto.attributes ? Object.keys(primerProducto.attributes).slice(0, 5) : [],
      })
    }
    
    return NextResponse.json({
      success: true,
      data: response.data || [],
      meta: response.meta || {},
      endpoint: endpointUsed,
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /tienda/productos] Error al obtener productos:', {
      message: error.message,
      status: error.status,
      details: error.details,
      stack: error.stack,
      url: process.env.NEXT_PUBLIC_STRAPI_URL,
      tieneToken: !!process.env.STRAPI_API_TOKEN,
    })
    
    // Si es un error 502, puede ser un problema de conexión con Strapi
    if (error.status === 502) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Error 502: No se pudo conectar con Strapi. Verifica que el servidor de Strapi esté disponible y que las variables de entorno estén configuradas correctamente.',
          data: [],
          meta: {},
        },
        { status: 502 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al obtener productos',
        data: [],
        meta: {},
      },
      { status: error.status || 500 }
    )
  }
}

