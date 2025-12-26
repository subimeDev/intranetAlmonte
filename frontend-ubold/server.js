#!/usr/bin/env node

// Script para iniciar Next.js en modo standalone con configuración para Railway
// Configura el hostname para que escuche en todas las interfaces de red

// Establecer variables de entorno ANTES de cargar cualquier módulo
const port = parseInt(process.env.PORT || '3000', 10)
const hostname = process.env.HOSTNAME || '0.0.0.0'

process.env.HOSTNAME = hostname
process.env.PORT = String(port)
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

console.log(`🚀 Iniciando servidor Next.js en modo standalone...`)
console.log(`📍 Hostname: ${hostname}`)
console.log(`🔌 Puerto: ${port}`)

// El servidor standalone de Next.js se inicia automáticamente al requerirlo
// y respeta las variables de entorno PORT y HOSTNAME
try {
  // Cambiar al directorio standalone para que los módulos relativos funcionen
  const path = require('path')
  const standaloneDir = path.join(__dirname, '.next/standalone')
  
  // Cambiar al directorio standalone
  process.chdir(standaloneDir)
  
  console.log(`📁 Directorio de trabajo: ${standaloneDir}`)
  
  // Cargar el servidor standalone (se inicia automáticamente)
  require('./server.js')
  
  console.log('✅ Servidor standalone iniciado correctamente')
  console.log(`🌐 Servidor disponible en http://${hostname}:${port}`)
} catch (error) {
  console.error('❌ Error al iniciar el servidor standalone:', error)
  console.error('Stack:', error.stack)
  console.log('Asegúrate de que el build se haya completado correctamente')
  process.exit(1)
}

