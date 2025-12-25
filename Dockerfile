# Usar imagen base de Node.js 20.9.0 (slim en lugar de alpine para mejor compatibilidad de memoria)
FROM node:20.9.0-slim AS base

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Variables de entorno base
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=6144 --no-warnings"
ENV CI=true
# NODE_ENV se establece solo en la etapa de build y runner, no en base

# Etapa de dependencias (mejor cache)
FROM base AS deps
# Copiar solo archivos de dependencias
COPY frontend-ubold/package*.json ./
# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
# Asegurar que NODE_ENV no esté en production para instalar devDependencies
# Usar NODE_OPTIONS para evitar problemas de memoria durante npm ci
RUN NODE_OPTIONS="--max-old-space-size=6144" \
    npm ci --prefer-offline --no-audit --legacy-peer-deps --include=dev || \
    NODE_OPTIONS="--max-old-space-size=6144" \
    npm install --prefer-offline --no-audit --legacy-peer-deps
# Verificar que TypeScript se instaló
RUN npm list typescript || (echo "ERROR: TypeScript no instalado" && exit 1)

# Etapa de build
FROM base AS builder
# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
# Copiar archivos necesarios para el build (evitar copiar todo)
COPY frontend-ubold/package*.json ./
COPY frontend-ubold/next.config.ts ./
COPY frontend-ubold/tsconfig.json ./
COPY frontend-ubold/middleware.ts ./
COPY frontend-ubold/src ./src
COPY frontend-ubold/public ./public
COPY frontend-ubold/fix-server.js ./
COPY frontend-ubold/server.js ./
# Asegurar que TypeScript esté instalado y disponible antes del build
RUN if ! npm list typescript > /dev/null 2>&1; then \
      echo "Instalando TypeScript..." && \
      npm install --save-dev typescript@^5.8.3; \
    fi && \
    node -e "require('typescript'); console.log('TypeScript disponible')" && \
    ls -la node_modules/typescript/package.json
# Construir la aplicación con optimizaciones de memoria
# Usar NODE_OPTIONS explícitamente para asegurar suficiente memoria
RUN NODE_OPTIONS="--max-old-space-size=6144" NODE_ENV=production npm run build
# Ejecutar postbuild para copiar archivos estáticos
RUN npm run postbuild || echo "Postbuild skipped"

# Etapa de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar solo archivos necesarios para producción
# El postbuild ya copió static y public dentro de standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/server.js ./server.js

# Cambiar ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
