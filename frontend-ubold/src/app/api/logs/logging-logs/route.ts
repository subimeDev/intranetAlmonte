import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/logging'
import { logStorage } from '@/lib/logging/logStorage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/logs/logging-logs
 * Endpoint para obtener información de debug sobre el sistema de logging
 * Simula lo que hace logActivity para verificar que las cookies estén disponibles
 */
export async function GET(request: NextRequest) {
  const logs: string[] = []
  
  // PRIMERO: Obtener logs reales del almacenamiento
  const realLogs = logStorage.getLogsByPrefix('[LOGGING]')
  
  // Si hay logs reales, usarlos
  if (realLogs.length > 0) {
    const formattedLogs = realLogs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString('es-CL')
      return `[${timestamp}] ${log.message}${log.data ? ' ' + JSON.stringify(log.data, null, 2) : ''}`
    })
    
    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      source: 'real',
      count: realLogs.length,
      message: 'Logs reales capturados del sistema de logging',
    })
  }
  
  // Si no hay logs reales, hacer simulación (fallback)
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('es-CL')
    logs.push(`[${timestamp}] ${message}`)
  }
  
  try {
    addLog('[LOGGING] ==========================================')
    addLog('[LOGGING] 🚀 SIMULANDO logActivity')
    addLog('[LOGGING] 🔍 Request tipo: ' + typeof request)
    addLog('[LOGGING] 🔍 Request es NextRequest?: ' + (request instanceof NextRequest))
    
    // Verificar cookies INMEDIATAMENTE
    const colaboradorCookie = request.cookies.get('colaboradorData')?.value
    const cookieHeader = request.headers.get('cookie')
    
    addLog('[LOGGING] 🍪 Cookie colaboradorData disponible?: ' + !!colaboradorCookie)
    addLog('[LOGGING] 🍪 Cookie preview: ' + (colaboradorCookie ? colaboradorCookie.substring(0, 200) : 'NO HAY COOKIE'))
    addLog('[LOGGING] 🍪 Cookie header disponible?: ' + !!cookieHeader)
    addLog('[LOGGING] 🍪 Cookie header preview: ' + (cookieHeader ? cookieHeader.substring(0, 200) : 'NO HAY HEADER'))
    
    // Intentar obtener usuario (simulando getUserFromRequest)
    addLog('[LOGGING] 🔍 [getUserFromRequest] Iniciando extracción de usuario...')
    
    if (colaboradorCookie) {
      try {
        const colaborador = JSON.parse(colaboradorCookie)
        addLog('[LOGGING] 👤 Colaborador parseado: ' + JSON.stringify({
          id: colaborador.id,
          documentId: colaborador.documentId,
          email_login: colaborador.email_login,
          tienePersona: !!colaborador.persona,
        }))
        
        // Extraer ID
        let colaboradorId: string | number | null = null
        
        if (colaborador.id !== undefined && colaborador.id !== null) {
          colaboradorId = colaborador.id
          addLog('[LOGGING] ✅ ID encontrado en nivel superior (colaborador.id): ' + colaboradorId)
        } else if (colaborador.documentId !== undefined && colaborador.documentId !== null) {
          colaboradorId = colaborador.documentId
          addLog('[LOGGING] ✅ ID encontrado en nivel superior (colaborador.documentId): ' + colaboradorId)
        } else {
          addLog('[LOGGING] ❌ No se pudo encontrar ID en el colaborador')
        }
        
        addLog('[LOGGING] 🔑 ID final extraído: ' + colaboradorId + ' (tipo: ' + typeof colaboradorId + ')')
        
        if (colaboradorId) {
          const usuarioIdNumero = Number(colaboradorId)
          if (isNaN(usuarioIdNumero)) {
            addLog('[LOGGING] ❌ ERROR: El ID del usuario no es un número válido')
            addLog('[LOGGING] ❌ ID original: ' + colaboradorId + ' (tipo: ' + typeof colaboradorId + ')')
          } else {
            addLog('[LOGGING] ✅ Usuario ID convertido a número: ' + usuarioIdNumero)
            addLog('[LOGGING] 📤 Log que se enviaría a Strapi: {"usuario": ' + usuarioIdNumero + ', ...}')
          }
        } else {
          addLog('[LOGGING] ❌ ERROR: No se pudo extraer ID del colaborador')
        }
        
        // Extraer email y nombre
        const emailLogin = colaborador.email_login || 'Sin email'
        const persona = colaborador.persona || {}
        const nombre = persona.nombre_completo || 
                      (persona.nombres && persona.primer_apellido ? 
                        `${persona.nombres} ${persona.primer_apellido}` : 
                        emailLogin)
        
        addLog('[LOGGING] ✅ Usuario extraído: {')
        addLog('  id: ' + colaboradorId + ',')
        addLog('  email: "' + emailLogin + '",')
        addLog('  nombre: "' + nombre + '"')
        addLog('}')
        
      } catch (parseError: any) {
        addLog('[LOGGING] ❌ Error al parsear cookie colaboradorData: ' + parseError.message)
      }
    } else {
      addLog('[LOGGING] ❌ No se encontró cookie colaboradorData')
      addLog('[LOGGING] ❌ Todas las cookies disponibles: ' + request.cookies.getAll().map(c => c.name).join(', '))
    }
    
    addLog('[LOGGING] ==========================================')
    
    return NextResponse.json({
      success: true,
      logs: logs,
      source: 'simulation',
      message: 'Logs simulados (no hay logs reales aún). Edita un producto para generar logs reales.',
    })
  } catch (error: any) {
    addLog('[LOGGING] ❌ ERROR GENERAL: ' + error.message)
    return NextResponse.json({
      success: false,
      logs: logs,
      error: error.message,
    }, { status: 500 })
  }
}

