/**
 * Cliente de Pusher para el frontend
 * Se usa en componentes de React para suscribirse a canales y escuchar eventos
 */

'use client'

import Pusher from 'pusher-js'

// Configuración de Pusher para el cliente
const getPusherClient = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!key || !cluster) {
    console.error('[Pusher Client] ⚠️ Variables de entorno de Pusher no configuradas')
    return null
  }

  // Crear instancia de Pusher (se reutiliza si ya existe)
  if (!(window as any).__pusherClient) {
    ;(window as any).__pusherClient = new Pusher(key, {
      cluster,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          // Las cookies se envían automáticamente
        },
      },
    })
  }

  return (window as any).__pusherClient as Pusher
}

export default getPusherClient

