#!/usr/bin/env node

// Script post-build para modificar el servidor standalone de Next.js
// Asegura que escuche en 0.0.0.0 en lugar de localhost o IP específica

const fs = require('fs')
const path = require('path')

const serverPath = path.join(__dirname, '.next/standalone/server.js')

if (!fs.existsSync(serverPath)) {
  console.error('Servidor standalone no encontrado. Asegúrate de ejecutar npm run build primero.')
  process.exit(1)
}

let serverCode = fs.readFileSync(serverPath, 'utf8')
const originalCode = serverCode

// Reemplazar localhost y 127.0.0.1 con 0.0.0.0
serverCode = serverCode.replace(/localhost/g, '0.0.0.0')
serverCode = serverCode.replace(/127\.0\.0\.1/g, '0.0.0.0')

// Buscar y reemplazar cualquier IP específica en listen() con 0.0.0.0
// Patrón: .listen(port, 'ip') -> .listen(port, '0.0.0.0')
serverCode = serverCode.replace(/\.listen\(([^,]+),\s*['"](?:localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)['"]/g, ".listen($1, '0.0.0.0'")

// Patrón: .listen(port) sin hostname -> .listen(port, '0.0.0.0')
// Solo si no tiene ya un segundo parámetro que sea una función
serverCode = serverCode.replace(/\.listen\((\w+)\)(?!\s*,\s*(?:['"]0\.0\.0\.0['"]|function|\([^)]*\)\s*=>))/g, ".listen($1, '0.0.0.0')")

// Patrón: .listen(port, callback) -> .listen(port, '0.0.0.0', callback)
serverCode = serverCode.replace(/\.listen\((\w+),\s*(function|\([^)]*\)\s*=>)/g, ".listen($1, '0.0.0.0', $2")

// Buscar createServer y asegurar que use 0.0.0.0
serverCode = serverCode.replace(/createServer\([^)]*\)\.listen\(([^,]+)\)/g, (match, port) => {
  if (!match.includes("'0.0.0.0'") && !match.includes('"0.0.0.0"')) {
    return match.replace(/\.listen\(([^)]+)\)/, ".listen($1, '0.0.0.0')")
  }
  return match
})

if (serverCode !== originalCode) {
  fs.writeFileSync(serverPath, serverCode)
  console.log('✓ Servidor standalone modificado para escuchar en 0.0.0.0')
} else {
  console.log('ℹ No se encontraron cambios necesarios en el servidor standalone')
}

