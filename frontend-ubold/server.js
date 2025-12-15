#!/usr/bin/env node

// Script para iniciar Next.js en modo standalone con configuración para Railway
// Configura el hostname para que escuche en todas las interfaces de red

// Establecer variables de entorno antes de cargar el servidor
process.env.HOSTNAME = '0.0.0.0'
process.env.PORT = process.env.PORT || '8080'

// El servidor standalone de Next.js debería respetar estas variables
// Si no funciona, necesitaremos modificar el servidor después del build
try {
  require('./.next/standalone/server.js')
} catch (error) {
  console.error('Error al cargar el servidor standalone:', error)
  console.log('Asegúrate de que el build se haya completado correctamente')
  process.exit(1)
}

