/**
 * Servidor de Pusher para el backend
 * Se usa en API routes para emitir eventos
 */

import Pusher from 'pusher'

const getPusherServer = () => {
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!appId || !key || !secret || !cluster) {
    console.error('[Pusher Server] ⚠️ Variables de entorno de Pusher no configuradas')
    return null
  }

  // Crear instancia de Pusher (singleton)
  if (!(global as any).__pusherServer) {
    ;(global as any).__pusherServer = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    })
  }

  return (global as any).__pusherServer as Pusher
}

export default getPusherServer

