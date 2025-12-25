#!/usr/bin/env node

// Script wrapper para iniciar Next.js en modo standalone con configuración para Railway
// Este archivo NO se usa en producción - el server.js de Next.js se usa directamente
// Se mantiene solo para referencia local

// Establecer variables de entorno antes de cargar el servidor
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0'
process.env.PORT = process.env.PORT || '8080'
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

console.log(`🚀 Iniciando servidor Next.js en modo standalone...`)
console.log(`📍 Hostname: ${process.env.HOSTNAME}`)
console.log(`🔌 Puerto: ${process.env.PORT}`)

// En producción, el server.js de Next.js (modificado por fix-server.js) se ejecuta directamente
// Este wrapper solo se usa en desarrollo local
try {
  // Intentar cargar el server.js de Next.js desde la ubicación estándar
  const path = require('path')
  const fs = require('fs')
  
  // Primero intentar desde .next/standalone (estructura original)
  const standalonePath = path.join(__dirname, '.next/standalone/server.js')
  if (fs.existsSync(standalonePath)) {
    require(standalonePath)
    console.log('✅ Servidor standalone cargado desde .next/standalone/server.js')
  } else {
    // Si no existe, el servidor debería estar en la raíz (después de copiar standalone)
    console.error('❌ No se encontró el servidor standalone')
    console.error('Asegúrate de que el build se haya completado correctamente')
    process.exit(1)
  }
} catch (error) {
  console.error('❌ Error al cargar el servidor standalone:', error.message)
  console.error('Stack:', error.stack)
  process.exit(1)
}



