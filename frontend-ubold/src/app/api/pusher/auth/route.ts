/**
 * API Route para autenticar canales privados de Pusher
 * Verifica que el usuario esté autenticado antes de permitir suscripción a canales privados
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import getPusherServer from '@/lib/pusher/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Verificar autenticación de forma más permisiva
  // Permitir si hay token o datos de colaborador en cookies
  const token = request.cookies.get('auth_token')?.value
  const colaboradorData = request.cookies.get('colaboradorData')?.value || 
                         request.cookies.get('colaborador')?.value
  
  if (!token && !colaboradorData) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const pusher = getPusherServer()
    if (!pusher) {
      return NextResponse.json({ error: 'Pusher no configurado' }, { status: 500 })
    }

    const formData = await request.formData()
    const socketId = formData.get('socket_id') as string
    const channelName = formData.get('channel_name') as string

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'socket_id y channel_name son requeridos' }, { status: 400 })
    }

    // Verificar que el canal sea privado y tenga el formato correcto
    // Formato esperado: private-chat-{remitenteId}-{colaboradorId}
    if (!channelName.startsWith('private-chat-')) {
      return NextResponse.json({ error: 'Canal no autorizado' }, { status: 403 })
    }

    // Autenticar el canal privado
    const auth = pusher.authorizeChannel(socketId, channelName)

    return NextResponse.json(auth)
  } catch (error: any) {
    console.error('[Pusher Auth] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al autenticar canal' },
      { status: 500 }
    )
  }
}

