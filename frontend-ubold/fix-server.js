#!/usr/bin/env node

// Script post-build para modificar el servidor standalone de Next.js
// Asegura que escuche en 0.0.0.0 en lugar de localhost

const fs = require('fs')
const path = require('path')

const serverPath = path.join(__dirname, '.next/standalone/server.js')

if (!fs.existsSync(serverPath)) {
  console.error('Servidor standalone no encontrado. Asegúrate de ejecutar npm run build primero.')
  process.exit(1)
}

let serverCode = fs.readFileSync(serverPath, 'utf8')

// Reemplazar localhost y 127.0.0.1 con 0.0.0.0
serverCode = serverCode.replace(/localhost/g, '0.0.0.0')
serverCode = serverCode.replace(/127\.0\.0\.1/g, '0.0.0.0')

// Buscar patrones de .listen() y asegurar que use 0.0.0.0
// Patrón: .listen(port) -> .listen(port, '0.0.0.0')
serverCode = serverCode.replace(/\.listen\((\w+)\)(?!\s*,\s*['"]0\.0\.0\.0['"])/g, ".listen($1, '0.0.0.0')")

// Patrón: .listen(port, callback) -> .listen(port, '0.0.0.0', callback)
serverCode = serverCode.replace(/\.listen\((\w+),\s*(function|\([^)]*\)\s*=>)/g, ".listen($1, '0.0.0.0', $2")

fs.writeFileSync(serverPath, serverCode)
console.log('Servidor standalone modificado para escuchar en 0.0.0.0')

