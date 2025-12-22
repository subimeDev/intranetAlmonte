/**
 * API Route para obtener clientes desde Strapi (WO-Clientes)
 * Esto evita exponer el token de Strapi en el cliente
 */

import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verificar que el token esté configurado
    const token = process.env.STRAPI_API_TOKEN
    if (!token) {
      console.error('[API /tienda/clientes] STRAPI_API_TOKEN no está configurado')
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

    // Endpoint de WO-Clientes en Strapi
    const endpointUsed = '/api/wo-clientes'
    const url = `${process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.moraleja.cl'}${endpointUsed}?populate=*&pagination[pageSize]=1000&sort=createdAt:desc`
    
    console.log('[API /tienda/clientes] Intentando obtener clientes:', {
      endpoint: endpointUsed,
      url: url.replace(/Bearer\s+\w+/, 'Bearer [TOKEN]'), // Ocultar token en logs
      tieneToken: !!token,
    })
    
    // Obtener clientes con populate=* para obtener todas las relaciones
    const response = await strapiClient.get<any>(
      `${endpointUsed}?populate=*&pagination[pageSize]=1000&sort=createdAt:desc`
    )
    
    // Log detallado para debugging
    console.log('[API /tienda/clientes] Respuesta de Strapi exitosa:', {
      endpoint: endpointUsed,
      hasData: !!response.data,
      isArray: Array.isArray(response.data),
      count: Array.isArray(response.data) ? response.data.length : response.data ? 1 : 0,
    })
    
    // Log del primer cliente para verificar estructura
    if (response.data && (Array.isArray(response.data) ? response.data[0] : response.data)) {
      const primerCliente = Array.isArray(response.data) ? response.data[0] : response.data
      console.log('[API /tienda/clientes] Primer cliente estructura:', {
        id: primerCliente.id,
        tieneAttributes: !!primerCliente.attributes,
        keysAttributes: primerCliente.attributes ? Object.keys(primerCliente.attributes).slice(0, 10) : [],
      })
    }
    
    return NextResponse.json({
      success: true,
      data: response.data || [],
      meta: response.meta || {},
      endpoint: endpointUsed,
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /tienda/clientes] Error al obtener clientes:', {
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
        error: error.message || 'Error al obtener clientes',
        data: [],
        meta: {},
      },
      { status: error.status || 500 }
    )
  }
}

