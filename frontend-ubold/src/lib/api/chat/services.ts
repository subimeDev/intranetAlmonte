/**
 * Servicios para el módulo de chat
 * Contiene la lógica de negocio reutilizable para mensajes de chat
 */

import strapiClient from '@/lib/strapi/client'
import type { StrapiResponse, StrapiEntity } from '@/lib/strapi/types'

export interface ChatMensajeAttributes {
  texto: string
  remitente_id: number
  cliente_id: number
  fecha: string
  leido: boolean
}

export interface ChatMensaje extends ChatMensajeAttributes {
  id: number | string
}

/**
 * Construye las queries para obtener mensajes bidireccionales
 */
export function buildChatQueries(
  remitenteId: number | string,
  colaboradorId: number | string,
  ultimaFecha?: string | null
): { query1: string; query2: string } {
  // Normalizar IDs a números
  const remitenteIdNum = typeof remitenteId === 'string' ? parseInt(remitenteId, 10) : Number(remitenteId)
  const colaboradorIdNum = typeof colaboradorId === 'string' ? parseInt(colaboradorId, 10) : Number(colaboradorId)
  
  // Estas queries se reconstruirán en getChatMessages con los IDs normalizados
  // Este método ahora solo es para referencia, la construcción real se hace en getChatMessages
  let query1 = `/api/intranet-chats?filters[remitente_id][$eq]=${remitenteIdNum}&filters[cliente_id][$eq]=${colaboradorIdNum}&sort=fecha:asc&pagination[pageSize]=1000`
  let query2 = `/api/intranet-chats?filters[remitente_id][$eq]=${colaboradorIdNum}&filters[cliente_id][$eq]=${remitenteIdNum}&sort=fecha:asc&pagination[pageSize]=1000`

  // IMPORTANTE: Solo aplicar filtro de fecha si se proporciona Y es válido
  // El filtro se aplica a AMBAS queries para capturar mensajes nuevos en ambas direcciones
  // Pero el margen de 60 segundos del frontend debería asegurar que no se pierdan mensajes
  if (ultimaFecha) {
    try {
      const fechaLimite = new Date(ultimaFecha)
      // Validar que la fecha sea válida
      if (!isNaN(fechaLimite.getTime())) {
        const fechaISO = encodeURIComponent(fechaLimite.toISOString())
        query1 += `&filters[fecha][$gt]=${fechaISO}`
        query2 += `&filters[fecha][$gt]=${fechaISO}`
      } else {
        console.error('[Chat Service] ⚠️ Fecha inválida, continuando sin filtro:', ultimaFecha)
      }
    } catch (e) {
      // Si hay error con la fecha, NO aplicar filtro para no perder mensajes
      console.error('[Chat Service] ⚠️ Error al procesar fecha límite, continuando sin filtro:', e)
    }
  }

  return { query1, query2 }
}

/**
 * Ejecuta una query con retry en caso de error 502
 */
export async function ejecutarQueryConRetry<T>(
  query: string,
  nombre: string,
  maxRetries = 2
): Promise<T> {
  for (let intento = 0; intento <= maxRetries; intento++) {
    try {
      const response = await strapiClient.get<T>(query)
      if (intento > 0) {
        console.log(`[Chat Service] ${nombre} exitoso en intento ${intento + 1}`)
      }
      return response
    } catch (err: any) {
      if (err.status === 502 && intento < maxRetries) {
        console.warn(`[Chat Service] ${nombre} falló con 502, reintentando... (intento ${intento + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (intento + 1))) // Esperar 1s, 2s, etc.
        continue
      }
      console.error(`[Chat Service] Error en ${nombre}:`, {
        message: err.message,
        status: err.status,
        url: query,
        intento: intento + 1,
      })
      return { data: [] } as T
    }
  }
  return { data: [] } as T
}

/**
 * Extrae y normaliza los datos de una respuesta de Strapi
 */
export function extractChatMessages(
  response: StrapiResponse<StrapiEntity<ChatMensajeAttributes>>
): ChatMensaje[] {
  if (!response?.data) {
    console.log('[Chat Service] ⚠️ Respuesta sin data')
    return []
  }

  const raw = Array.isArray(response.data) ? response.data : [response.data]
  
  console.error('[Chat Service] 📋 Extrayendo mensajes:', {
    total: raw.length,
    primeros: raw.slice(0, 3).map((item: any) => ({
      id: item.id,
      tieneAttributes: !!item.attributes,
      remitente_id: item.attributes?.remitente_id || item.remitente_id,
      cliente_id: item.attributes?.cliente_id || item.cliente_id,
    }))
  })
  
  return raw.map((item: any) => {
    const attrs = item.attributes || item
    const mensaje = {
      ...attrs,
      id: item.id || attrs.id,
    }
    
    // Validar que el mensaje tiene los campos necesarios
    if (!mensaje.id || !mensaje.remitente_id || !mensaje.cliente_id) {
      console.warn('[Chat Service] ⚠️ Mensaje con campos faltantes:', {
        id: mensaje.id,
        remitente_id: mensaje.remitente_id,
        cliente_id: mensaje.cliente_id,
        itemRaw: JSON.stringify(item).substring(0, 200),
      })
    }
    
    return mensaje
  })
}

/**
 * Combina y ordena mensajes por fecha
 */
export function combineAndSortMessages(messages1: ChatMensaje[], messages2: ChatMensaje[]): ChatMensaje[] {
  const allMessages = [...messages1, ...messages2]
  
  return allMessages.sort((a, b) => {
    const fechaA = new Date(a.fecha || 0).getTime()
    const fechaB = new Date(b.fecha || 0).getTime()
    return fechaA - fechaB
  })
}

/**
 * Obtiene mensajes entre dos colaboradores
 */
export async function getChatMessages(
  remitenteId: number | string,
  colaboradorId: number | string,
  ultimaFecha?: string | null
): Promise<ChatMensaje[]> {
  // buildChatQueries ya normaliza los IDs, pero también lo hacemos aquí para seguridad
  const { query1, query2 } = buildChatQueries(remitenteId, colaboradorId, ultimaFecha)

  // CRÍTICO: Normalizar IDs a números enteros para asegurar consistencia
  const remitenteIdNum = typeof remitenteId === 'string' ? parseInt(remitenteId, 10) : Number(remitenteId)
  const colaboradorIdNum = typeof colaboradorId === 'string' ? parseInt(colaboradorId, 10) : Number(colaboradorId)
  
  // Logs detallados para debugging (usar error para que siempre se vea)
  console.error('[Chat Service] 🔍 Obteniendo mensajes:', { 
    remitenteIdOriginal: remitenteId,
    colaboradorIdOriginal: colaboradorId,
    remitenteIdNormalizado: remitenteIdNum, 
    colaboradorIdNormalizado: colaboradorIdNum, 
    tieneUltimaFecha: !!ultimaFecha,
    ultimaFecha,
    query1: query1.substring(0, 200),
    query2: query2.substring(0, 200),
  })
  
  // Validar IDs normalizados
  if (!remitenteIdNum || !colaboradorIdNum || isNaN(remitenteIdNum) || isNaN(colaboradorIdNum)) {
    console.error('[Chat Service] ❌ ERROR: IDs inválidos después de normalización', { 
      remitenteId, 
      colaboradorId, 
      remitenteIdNum, 
      colaboradorIdNum 
    })
    return []
  }
  
  // Reconstruir queries con IDs normalizados
  let query1Final = `/api/intranet-chats?filters[remitente_id][$eq]=${remitenteIdNum}&filters[cliente_id][$eq]=${colaboradorIdNum}&sort=fecha:asc&pagination[pageSize]=1000`
  let query2Final = `/api/intranet-chats?filters[remitente_id][$eq]=${colaboradorIdNum}&filters[cliente_id][$eq]=${remitenteIdNum}&sort=fecha:asc&pagination[pageSize]=1000`
  
  // Aplicar filtro de fecha si existe
  if (ultimaFecha) {
    try {
      const fechaLimite = new Date(ultimaFecha)
      if (!isNaN(fechaLimite.getTime())) {
        const fechaISO = encodeURIComponent(fechaLimite.toISOString())
        query1Final += `&filters[fecha][$gt]=${fechaISO}`
        query2Final += `&filters[fecha][$gt]=${fechaISO}`
      }
    } catch (e) {
      console.error('[Chat Service] ⚠️ Error al procesar fecha límite:', e)
    }
  }

  const [response1, response2] = await Promise.all([
    ejecutarQueryConRetry<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>>(query1Final, 'query1'),
    ejecutarQueryConRetry<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>>(query2Final, 'query2'),
  ])

  const data1 = extractChatMessages(response1)
  const data2 = extractChatMessages(response2)

  console.error('[Chat Service] 📦 Respuestas obtenidas:', { 
    query1Count: data1.length,
    query2Count: data2.length,
    query1Sample: data1.length > 0 ? { id: data1[0].id, remitente_id: data1[0].remitente_id, cliente_id: data1[0].cliente_id } : null,
    query2Sample: data2.length > 0 ? { id: data2[0].id, remitente_id: data2[0].remitente_id, cliente_id: data2[0].cliente_id } : null,
  })

  const allMessages = combineAndSortMessages(data1, data2)

  console.error('[Chat Service] ✅ Total mensajes combinados:', { 
    total: allMessages.length,
    enviados: data1.length,
    recibidos: data2.length,
    primerosIds: allMessages.slice(0, 5).map(m => ({ id: m.id, remitente_id: m.remitente_id, cliente_id: m.cliente_id }))
  })

  return allMessages
}

/**
 * Envía un nuevo mensaje de chat
 */
export async function sendChatMessage(
  texto: string,
  remitenteId: number | string,
  colaboradorId: number | string
): Promise<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>> {
  // CRÍTICO: Normalizar IDs a números enteros para asegurar consistencia con Strapi
  const remitenteIdNum = typeof remitenteId === 'string' ? parseInt(remitenteId, 10) : Number(remitenteId)
  const colaboradorIdNum = typeof colaboradorId === 'string' ? parseInt(colaboradorId, 10) : Number(colaboradorId)
  
  // Logs detallados para debugging (usar error para que siempre se vea)
  console.error('[Chat Service] 📤 Enviando mensaje:', {
    texto: texto.substring(0, 50),
    remitente_id_original: remitenteId,
    cliente_id_original: colaboradorId,
    remitente_id_normalizado: remitenteIdNum,
    cliente_id_normalizado: colaboradorIdNum,
    fecha: new Date().toISOString(),
  })
  
  // Validar IDs normalizados
  if (!remitenteIdNum || !colaboradorIdNum || isNaN(remitenteIdNum) || isNaN(colaboradorIdNum)) {
    console.error('[Chat Service] ❌ ERROR: IDs inválidos al enviar después de normalización', { 
      remitenteId, 
      colaboradorId, 
      remitenteIdNum, 
      colaboradorIdNum 
    })
    throw new Error('IDs inválidos al enviar mensaje')
  }

  const response = await strapiClient.post<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>>(
    '/api/intranet-chats',
    {
      data: {
        texto,
        remitente_id: remitenteIdNum,
        cliente_id: colaboradorIdNum,
        fecha: new Date().toISOString(),
        leido: false,
      },
    }
  )

  const savedMessage = Array.isArray(response.data) ? response.data[0] : response.data
  const savedMessageData = (savedMessage as any)?.attributes || savedMessage
  
  console.error('[Chat Service] ✅ Mensaje guardado en Strapi:', {
    id: (savedMessage as any)?.id || savedMessageData?.id,
    remitente_id: savedMessageData?.remitente_id,
    cliente_id: savedMessageData?.cliente_id,
    fecha: savedMessageData?.fecha,
    texto: savedMessageData?.texto?.substring(0, 50),
  })

  return response
}
