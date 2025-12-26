/**
 * API Route para obtener y enviar mensajes de chat
 * 
 * Esta ruta utiliza servicios modulares para mantener la lógica de negocio separada
 */

import { NextRequest, NextResponse } from 'next/server'
import { getChatMessages, sendChatMessage } from '@/lib/api/chat/services'
import { validateGetMessagesParams, validateSendMessageParams } from '@/lib/api/chat/validators'
import { requireAuth } from '@/lib/auth/middleware'
import getPusherServer from '@/lib/pusher/server'

export const dynamic = 'force-dynamic'

/**
 * GET - Obtener mensajes entre dos colaboradores (bidireccional)
 */
export async function GET(request: NextRequest) {
  // Verificar autenticación
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const colaboradorId = searchParams.get('colaborador_id')
    const remitenteId = searchParams.get('remitente_id')
    const ultimaFecha = searchParams.get('ultima_fecha')
    
    // Validar parámetros
    const validation = validateGetMessagesParams(colaboradorId, remitenteId)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    // CRÍTICO: Normalizar IDs a números enteros
    const colaboradorIdNum = parseInt(String(colaboradorId), 10)
    const remitenteIdNum = parseInt(String(remitenteId), 10)
    
    console.error('[API /chat/mensajes GET] 📥 Obteniendo mensajes:', {
      remitenteId_original: remitenteId,
      colaboradorId_original: colaboradorId,
      remitenteId_normalizado: remitenteIdNum,
      colaboradorId_normalizado: colaboradorIdNum,
      tieneUltimaFecha: !!ultimaFecha,
      ultimaFecha: ultimaFecha?.substring(0, 20),
    })
    
    // Validar IDs normalizados
    if (isNaN(remitenteIdNum) || isNaN(colaboradorIdNum) || !remitenteIdNum || !colaboradorIdNum) {
      console.error('[API /chat/mensajes GET] ❌ ERROR: IDs inválidos después de normalización', {
        remitenteId,
        colaboradorId,
        remitenteIdNum,
        colaboradorIdNum,
      })
      return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 })
    }
    
    // Obtener mensajes usando el servicio modular
    const allMessages = await getChatMessages(remitenteIdNum, colaboradorIdNum, ultimaFecha)
    
    console.log('[API /chat/mensajes GET] ✅ Mensajes obtenidos:', {
      total: allMessages.length,
      primeros: allMessages.slice(0, 3).map(m => ({
        id: m.id,
        remitente_id: m.remitente_id,
        cliente_id: m.cliente_id,
        texto: m.texto?.substring(0, 30),
      }))
    })
    
    return NextResponse.json({ data: allMessages, meta: {} }, { status: 200 })
  } catch (error: any) {
    console.error('[API /chat/mensajes] Error:', error)
    if (error.status === 404) {
      return NextResponse.json({ data: [], meta: {} }, { status: 200 })
    }
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
  // Verificar autenticación
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { texto, colaborador_id, remitente_id } = body
    
    // Validar parámetros
    const validation = validateSendMessageParams(texto, colaborador_id, remitente_id)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    const colaboradorIdNum = parseInt(String(colaborador_id), 10)
    const remitenteIdNum = parseInt(String(remitente_id), 10)
    
    console.log('[API /chat/mensajes POST] 📤 Enviando mensaje:', {
      texto: texto.substring(0, 50),
      remitente_id: remitenteIdNum,
      colaborador_id: colaboradorIdNum,
    })
    
    // Enviar mensaje usando el servicio modular
    const response = await sendChatMessage(texto, remitenteIdNum, colaboradorIdNum)
    
    console.log('[API /chat/mensajes POST] ✅ Mensaje enviado exitosamente')
    
    // Retornar el mensaje guardado en el formato esperado por el cliente
    const savedMessage = Array.isArray(response.data) ? response.data[0] : response.data
    const savedMessageData = (savedMessage as any)?.attributes || savedMessage
    
    const mensajeFormateado = {
      id: (savedMessage as any)?.id || savedMessageData?.id,
      texto: savedMessageData?.texto || texto,
      remitente_id: savedMessageData?.remitente_id || remitenteIdNum,
      cliente_id: savedMessageData?.cliente_id || colaboradorIdNum,
      fecha: savedMessageData?.fecha || new Date().toISOString(),
      leido: savedMessageData?.leido || false,
    }
    
    // Emitir evento Pusher para notificar a ambos usuarios en tiempo real
    try {
      const pusher = getPusherServer()
      if (pusher) {
        // Crear nombre de canal único para esta conversación (ordenado para que ambos usuarios usen el mismo)
        const idsOrdenados = [remitenteIdNum, colaboradorIdNum].sort((a, b) => a - b)
        const channelName = `private-chat-${idsOrdenados[0]}-${idsOrdenados[1]}`
        
        // Emitir evento a ambos usuarios
        await pusher.trigger(channelName, 'new-message', mensajeFormateado)
        
        console.log('[API /chat/mensajes POST] 📡 Evento Pusher emitido:', {
          channel: channelName,
          mensajeId: mensajeFormateado.id,
        })
      }
    } catch (pusherError) {
      // No fallar si Pusher falla, solo loggear
      console.error('[API /chat/mensajes POST] ⚠️ Error al emitir evento Pusher:', pusherError)
    }
    
    return NextResponse.json({
      data: mensajeFormateado,
      meta: {}
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API /chat/mensajes POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al enviar mensaje' },
      { status: error.status || 500 }
    )
  }
}
