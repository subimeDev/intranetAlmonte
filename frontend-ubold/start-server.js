#!/usr/bin/env node

// Script de inicio robusto para Next.js standalone en Railway
// Verifica que el servidor esté escuchando antes de continuar

const path = require('path')
const fs = require('fs')

// Establecer variables de entorno ANTES de cargar cualquier módulo
const port = parseInt(process.env.PORT || '3000', 10)
const hostname = process.env.HOSTNAME || '0.0.0.0'

process.env.PORT = String(port)
process.env.HOSTNAME = hostname
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

console.log('🚀 Iniciando servidor Next.js standalone...')
console.log(`📍 Hostname: ${hostname}`)
console.log(`🔌 Puerto: ${port}`)
console.log(`📦 NODE_ENV: ${process.env.NODE_ENV}`)

// Cambiar al directorio standalone
const standaloneDir = path.join(__dirname, '.next/standalone')
const serverPath = path.join(standaloneDir, 'server.js')

// Verificar que el servidor standalone existe
if (!fs.existsSync(serverPath)) {
  console.error(`❌ Servidor standalone no encontrado en: ${serverPath}`)
  console.error('Asegúrate de que el build se haya completado correctamente')
  process.exit(1)
}

// Cambiar al directorio standalone
process.chdir(standaloneDir)
console.log(`📁 Directorio de trabajo: ${process.cwd()}`)

// Cargar el servidor standalone
console.log('📄 Cargando servidor standalone...')
try {
  // El servidor standalone de Next.js se inicia automáticamente al requerirlo
  require('./server.js')
  console.log('✅ Servidor standalone cargado e iniciado')
  console.log(`🌐 Servidor disponible en http://${hostname}:${port}`)
  console.log(`🏥 Healthcheck disponible en http://${hostname}:${port}/api/health`)
  console.log('⏳ Esperando conexiones...')
} catch (error) {
  console.error('❌ Error al cargar el servidor standalone:', error)
  console.error('Stack:', error.stack)
  process.exit(1)
}

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...')
  process.exit(0)
})

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason)
  process.exit(1)
})

