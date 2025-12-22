/**
 * API Route para obtener clientes desde Strapi (WO-Clientes)
 * Esto evita exponer el token de Strapi en el cliente
 */

import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import type { StrapiResponse, StrapiEntity } from '@/lib/strapi/types'
import { parseNombreCompleto, enviarClienteABothWordPress } from '@/lib/clientes/utils'

export const dynamic = 'force-dynamic'

interface WOClienteAttributes {
  nombre?: string
  NOMBRE?: string  // Puede venir en mayúsculas desde Strapi
  correo_electronico: string
  ultima_actividad?: string
  fecha_registro?: string
  pedidos?: number
  gasto_total?: number
  // Nota: telefono y direccion no existen en el schema de WO-Clientes
  createdAt?: string
  updatedAt?: string
}

export async function GET() {
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

    // Endpoint de WO-Clientes
    const endpointUsed = '/api/wo-clientes'
    
    console.log('[API /tienda/clientes] Intentando obtener clientes:', {
      endpoint: endpointUsed,
      tieneToken: !!token,
    })
    
    // Usar populate=* para obtener todas las relaciones
    const response = await strapiClient.get<StrapiResponse<StrapiEntity<WOClienteAttributes>>>(
      `${endpointUsed}?populate=*&pagination[pageSize]=1000&sort=nombre:asc`
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[API Clientes POST] 📝 Creando cliente:', body)

    // Validar nombre y correo obligatorios
    if (!body.data?.nombre || !body.data?.nombre.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El nombre del cliente es obligatorio'
      }, { status: 400 })
    }

    if (!body.data?.correo_electronico || !body.data?.correo_electronico.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El correo electrónico del cliente es obligatorio'
      }, { status: 400 })
    }

    // Crear en Strapi
    console.log('[API Clientes POST] 📚 Creando cliente en Strapi...')
    
    // Solo incluir campos válidos en el schema de WO-Clientes
    const clienteData: any = {
      data: {
        nombre: body.data.nombre.trim(),
        correo_electronico: body.data.correo_electronico.trim(),
        pedidos: body.data.pedidos ? parseInt(body.data.pedidos) || 0 : 0,
        gasto_total: body.data.gasto_total ? parseFloat(body.data.gasto_total) || 0 : 0,
        fecha_registro: body.data.fecha_registro || new Date().toISOString(),
      },
    }
    
    // Solo agregar ultima_actividad si está definida
    if (body.data.ultima_actividad) {
      clienteData.data.ultima_actividad = body.data.ultima_actividad
    }

    // 1. Crear en WO-Clientes (Strapi)
    const woClienteResponse = await strapiClient.post('/api/wo-clientes', clienteData) as any
    console.log('[API Clientes POST] ✅ Cliente creado en WO-Clientes:', woClienteResponse.id || woClienteResponse.documentId || woClienteResponse.data?.id || woClienteResponse.data?.documentId)
    
    // 2. Parsear nombre para Persona
    const nombreParseado = parseNombreCompleto(body.data.nombre.trim())
    
    // 3. Crear en Persona (Strapi)
    let personaResponse: any = null
    try {
      const personaData: any = {
        data: {
          nombre_completo: body.data.nombre.trim(),
          nombres: nombreParseado.nombres || null,
          primer_apellido: nombreParseado.primer_apellido || null,
          segundo_apellido: nombreParseado.segundo_apellido || null,
          emails: [
            {
              email: body.data.correo_electronico.trim(),
              tipo: 'principal',
            }
          ],
        },
      }
      
      personaResponse = await strapiClient.post('/api/personas', personaData) as any
      console.log('[API Clientes POST] ✅ Persona creada en Strapi:', personaResponse.id || personaResponse.documentId || personaResponse.data?.id || personaResponse.data?.documentId)
    } catch (personaError: any) {
      console.error('[API Clientes POST] ⚠️ Error al crear Persona (no crítico):', personaError.message)
      // No fallar si Persona falla, el cliente ya está en WO-Clientes
    }
    
    // 4. Enviar a ambos WordPress
    let wordPressResults: any = null
    try {
      wordPressResults = await enviarClienteABothWordPress({
        email: body.data.correo_electronico.trim(),
        first_name: nombreParseado.nombres || body.data.nombre.trim(),
        last_name: nombreParseado.primer_apellido || '',
      })
      console.log('[API Clientes POST] ✅ Cliente enviado a WordPress:', {
        escolar: wordPressResults.escolar.success,
        moraleja: wordPressResults.moraleja.success,
      })
    } catch (wpError: any) {
      console.error('[API Clientes POST] ⚠️ Error al enviar a WordPress (no crítico):', wpError.message)
      // No fallar si WordPress falla
    }
    
    return NextResponse.json({
      success: true,
      data: woClienteResponse,
      persona: personaResponse || null,
      wordpress: wordPressResults || null,
    })
  } catch (error: any) {
    console.error('[API Clientes POST] ❌ Error:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al crear el cliente'
    }, { status: 500 })
  }
}

