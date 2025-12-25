# Usar imagen base de Node.js 20.9.0 o superior
FROM node:20.9.0-alpine AS base

# Instalar solo lo necesario para build
RUN apk add --no-cache libc6-compat

# Establecer directorio de trabajo
WORKDIR /app

# Variables de entorno para optimizar build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Etapa de dependencias (mejor cache)
FROM base AS deps
# Copiar solo archivos de dependencias
COPY frontend-ubold/package*.json ./
# Instalar dependencias con cache optimizado
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps --silent || \
    npm install --prefer-offline --no-audit --legacy-peer-deps --silent

# Etapa de build
FROM base AS builder
# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
# Copiar archivos necesarios para el build
# Usar .dockerignore para excluir node_modules y otros archivos innecesarios
COPY frontend-ubold/ ./
# Construir la aplicación con optimizaciones
RUN npm run build

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
# Next.js standalone ya incluye lo necesario, pero necesitamos copiar static y public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js

# Cambiar ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
