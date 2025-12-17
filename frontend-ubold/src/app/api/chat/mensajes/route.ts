/**
 * API Route para obtener y enviar mensajes de chat
 */

import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import type { StrapiResponse, StrapiEntity } from '@/lib/strapi/types'

export const dynamic = 'force-dynamic'

interface ChatMensajeAttributes {
  texto: string
  remitente_id: number
  cliente_id: number
  fecha: string
  leido: boolean
}

/**
 * GET - Obtener mensajes entre dos colaboradores (bidireccional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const colaboradorId = searchParams.get('colaborador_id') // ID del colaborador con quien chateas
    const remitenteId = searchParams.get('remitente_id') // ID del colaborador autenticado (quien solicita)
    const ultimaFecha = searchParams.get('ultima_fecha')
    
    if (!colaboradorId || !remitenteId) {
      return NextResponse.json({ error: 'colaborador_id y remitente_id son requeridos' }, { status: 400 })
    }
    
    // Convertir IDs a números
    const colaboradorIdNum = parseInt(colaboradorId, 10)
    const remitenteIdNum = parseInt(remitenteId, 10)
    
    if (isNaN(colaboradorIdNum) || isNaN(remitenteIdNum)) {
      return NextResponse.json({ error: 'colaborador_id y remitente_id deben ser números válidos' }, { status: 400 })
    }
    
    // Obtener mensajes bidireccionales:
    // - Mensajes donde remitente_id = remitenteIdNum Y cliente_id = colaboradorIdNum (yo envié a él)
    // - O mensajes donde remitente_id = colaboradorIdNum Y cliente_id = remitenteIdNum (él envió a mí)
    // Usamos $or para combinar ambas condiciones
    // Sintaxis de Strapi v4 para $or: filters[$or][0][field][$eq]=value&filters[$or][1][field][$eq]=value
    let query = `/api/intranet-chats?filters[$or][0][remitente_id][$eq]=${remitenteIdNum}&filters[$or][0][cliente_id][$eq]=${colaboradorIdNum}&filters[$or][1][remitente_id][$eq]=${colaboradorIdNum}&filters[$or][1][cliente_id][$eq]=${remitenteIdNum}&sort=fecha:asc&pagination[pageSize]=1000`
    
    if (ultimaFecha) {
      // Para nuevos mensajes, agregar filtro de fecha
      query += `&filters[fecha][$gt]=${ultimaFecha}`
    }
    
    console.log('[API /chat/mensajes] Obteniendo mensajes bidireccionales:', {
      colaboradorId: colaboradorIdNum,
      remitenteId: remitenteIdNum,
      ultimaFecha,
      query,
    })
    
    const response = await strapiClient.get<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>>(query)
    
    // Log para debugging
    const mensajesData = Array.isArray(response.data) ? response.data : [response.data]
    console.log('[API /chat/mensajes] Mensajes recibidos:', {
      count: mensajesData.length,
      sample: mensajesData[0],
    })
    
    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    // Si es 404, el content type no existe aún - retornar array vacío en lugar de error
    if (error.status === 404) {
      return NextResponse.json(
        { data: [], meta: {} },
        { status: 200 }
      )
    }
    console.error('Error al obtener mensajes:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener mensajes' },
      { status: error.status || 500 }
    )
  }
}

/**
 * POST - Enviar un nuevo mensaje
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { texto, colaborador_id, remitente_id } = body
    
    if (!texto || !colaborador_id || !remitente_id) {
      return NextResponse.json(
        { error: 'texto, colaborador_id y remitente_id son requeridos' },
        { status: 400 }
      )
    }
    
    // Convertir IDs a números
    const colaboradorIdNum = parseInt(String(colaborador_id), 10)
    const remitenteIdNum = parseInt(String(remitente_id), 10)
    
    if (isNaN(colaboradorIdNum) || isNaN(remitenteIdNum)) {
      return NextResponse.json(
        { error: 'colaborador_id y remitente_id deben ser números válidos' },
        { status: 400 }
      )
    }
    
    console.log('[API /chat/mensajes] Enviando mensaje:', {
      texto: texto.substring(0, 50) + '...',
      colaborador_id: colaboradorIdNum, // ID del colaborador con quien chateas
      remitente_id: remitenteIdNum, // ID del colaborador autenticado (quien envía)
    })
    
    const response = await strapiClient.post<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>>(
      '/api/intranet-chats',
      {
        data: {
          texto,
          remitente_id: remitenteIdNum,
          cliente_id: colaboradorIdNum, // Usamos cliente_id en Strapi pero representa colaborador_id
          fecha: new Date().toISOString(),
          leido: false,
        },
      }
    )
    
    console.log('[API /chat/mensajes] Mensaje enviado exitosamente:', {
      id: Array.isArray(response.data) ? response.data[0]?.id : response.data?.id,
    })
    
    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error al enviar mensaje:', error)
    return NextResponse.json(
      { error: error.message || 'Error al enviar mensaje' },
      { status: error.status || 500 }
    )
  }
}

