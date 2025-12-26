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
  remitenteId: number,
  colaboradorId: number,
  ultimaFecha?: string | null
): { query1: string; query2: string } {
  let query1 = `/api/intranet-chats?filters[remitente_id][$eq]=${remitenteId}&filters[cliente_id][$eq]=${colaboradorId}&sort=fecha:asc&pagination[pageSize]=1000`
  let query2 = `/api/intranet-chats?filters[remitente_id][$eq]=${colaboradorId}&filters[cliente_id][$eq]=${remitenteId}&sort=fecha:asc&pagination[pageSize]=1000`

  // Aplicar filtro de fecha a ambas queries para polling eficiente
  // Esto captura mensajes nuevos en ambas direcciones (enviados y recibidos)
  if (ultimaFecha) {
    try {
      const fechaLimite = new Date(ultimaFecha)
      // El margen ya viene aplicado desde el frontend, solo usar la fecha tal cual
      const fechaISO = encodeURIComponent(fechaLimite.toISOString())
      query1 += `&filters[fecha][$gt]=${fechaISO}`
      query2 += `&filters[fecha][$gt]=${fechaISO}`
    } catch (e) {
      // Ignorar error de fecha y continuar sin filtro para no perder mensajes
      console.warn('[Chat Service] Error al procesar fecha límite, continuando sin filtro:', e)
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
  
  console.log('[Chat Service] 📋 Extrayendo mensajes:', {
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
  remitenteId: number,
  colaboradorId: number,
  ultimaFecha?: string | null
): Promise<ChatMensaje[]> {
  const { query1, query2 } = buildChatQueries(remitenteId, colaboradorId, ultimaFecha)

  // Logs detallados para debugging (siempre activos para ver qué está pasando)
  console.log('[Chat Service] 🔍 Obteniendo mensajes:', { 
    remitenteId, 
    colaboradorId, 
    tieneUltimaFecha: !!ultimaFecha,
    ultimaFecha,
    query1: query1.substring(0, 200),
    query2: query2.substring(0, 200),
  })

  const [response1, response2] = await Promise.all([
    ejecutarQueryConRetry<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>>(query1, 'query1'),
    ejecutarQueryConRetry<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>>(query2, 'query2'),
  ])

  const data1 = extractChatMessages(response1)
  const data2 = extractChatMessages(response2)

  console.log('[Chat Service] 📦 Respuestas obtenidas:', { 
    query1Count: data1.length,
    query2Count: data2.length,
    query1Sample: data1.length > 0 ? { id: data1[0].id, remitente_id: data1[0].remitente_id, cliente_id: data1[0].cliente_id } : null,
    query2Sample: data2.length > 0 ? { id: data2[0].id, remitente_id: data2[0].remitente_id, cliente_id: data2[0].cliente_id } : null,
  })

  const allMessages = combineAndSortMessages(data1, data2)

  console.log('[Chat Service] ✅ Total mensajes combinados:', { 
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
  remitenteId: number,
  colaboradorId: number
): Promise<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>> {
  // Logs detallados para debugging
  console.log('[Chat Service] 📤 Enviando mensaje:', {
    texto: texto.substring(0, 50),
    remitente_id: remitenteId,
    cliente_id: colaboradorId,
    fecha: new Date().toISOString(),
  })

  const response = await strapiClient.post<StrapiResponse<StrapiEntity<ChatMensajeAttributes>>>(
    '/api/intranet-chats',
    {
      data: {
        texto,
        remitente_id: remitenteId,
        cliente_id: colaboradorId,
        fecha: new Date().toISOString(),
        leido: false,
      },
    }
  )

  const savedMessage = Array.isArray(response.data) ? response.data[0] : response.data
  const savedMessageData = (savedMessage as any)?.attributes || savedMessage
  
  console.log('[Chat Service] ✅ Mensaje guardado en Strapi:', {
    id: (savedMessage as any)?.id || savedMessageData?.id,
    remitente_id: savedMessageData?.remitente_id,
    cliente_id: savedMessageData?.cliente_id,
    fecha: savedMessageData?.fecha,
    texto: savedMessageData?.texto?.substring(0, 50),
  })

  return response
}
