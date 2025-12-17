/**
 * API Route para obtener productos desde Strapi
 * Esto evita exponer el token de Strapi en el cliente
 */

import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    console.log('[API POST] 📝 Iniciando creación de producto')
    
    const body = await request.json()
    console.log('[API POST] 📝 Datos recibidos:', JSON.stringify(body, null, 2))

    // Validar campos requeridos
    if (!body.nombre_libro || !body.nombre_libro.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El nombre del libro es obligatorio'
      }, { status: 400 })
    }

    // Generar ISBN automático si no viene (para evitar error de duplicado)
    const isbn = body.isbn_libro?.trim() || `ISBN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log('[API POST] 📚 ISBN generado/usado:', isbn)

    // Preparar datos básicos
    const productData: any = {
      data: {
        isbn_libro: isbn,
        nombre_libro: body.nombre_libro.trim()
      }
    }

    // Campos opcionales básicos
    if (body.subtitulo_libro?.trim()) {
      productData.data.subtitulo_libro = body.subtitulo_libro.trim()
    }
    
    if (body.descripcion?.trim()) {
      productData.data.descripcion = body.descripcion.trim()
    }
    
    // Si hay imagen (ID de Media de Strapi)
    if (body.portada_libro !== undefined && body.portada_libro !== null) {
      productData.data.portada_libro = body.portada_libro
    }

    // FASE 2: Relaciones (preparado para implementar después)
    // if (body.editorial) productData.data.editorial = body.editorial // documentId
    // if (body.coleccion) productData.data.coleccion = body.coleccion
    // if (body.sello) productData.data.sello = body.sello
    // if (body.canales && body.canales.length > 0) {
    //   productData.data.canales = body.canales // array de documentIds
    // }

    console.log('[API POST] 📤 Enviando a Strapi:', JSON.stringify(productData, null, 2))

    const response = await strapiClient.post<any>('/api/libros', productData)

    console.log('[API POST] ✅ Producto creado:', JSON.stringify(response, null, 2))

    return NextResponse.json({
      success: true,
      data: response.data || response
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API POST] ❌ ERROR:', {
      message: error.message,
      status: error.status,
      details: error.details,
      errores: error.details?.errors
    })
    
    // Manejar error de ISBN duplicado específicamente
    if (error.details?.errors?.isbn_libro) {
      return NextResponse.json({
        success: false,
        error: 'El ISBN ya existe. Por favor usa otro ISBN o déjalo vacío para generar uno automático.',
        details: error.details.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al crear producto',
      details: error.details?.errors
    }, { status: error.status || 500 })
  }
}

