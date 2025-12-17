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
    // Endpoint correcto confirmado: /api/libros (verificado en test-strapi)
    const endpointUsed = '/api/libros'
    
    // Populate específico para asegurar que las imágenes se traigan correctamente
    // En Strapi v4, a veces populate=* no trae todos los campos de media
    const populateParams = [
      'populate[portada_libro][populate]=*',
      'populate[PORTADA_LIBRO][populate]=*',
      'populate[imagenes_interior][populate]=*',
      'populate[autor_relacion][populate]=*',
      'populate[editorial][populate]=*',
      'populate[precios][populate]=*',
      'populate[stocks][populate]=*',
      'populate[STOCKS][populate]=*',
      'populate[PRECIOS][populate]=*',
      'pagination[pageSize]=100'
    ].join('&')
    
    const response = await strapiClient.get<any>(`${endpointUsed}?${populateParams}`)
    
    // Log detallado para debugging
    console.log('[API /tienda/productos] Respuesta de Strapi:', {
      endpoint: endpointUsed,
      populateParams,
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
        keysAttributes: primerProducto.attributes ? Object.keys(primerProducto.attributes) : [],
        portada_libro: primerProducto.attributes?.portada_libro,
        PORTADA_LIBRO: primerProducto.attributes?.PORTADA_LIBRO,
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
    })
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

