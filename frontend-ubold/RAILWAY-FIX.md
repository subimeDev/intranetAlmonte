# Solución para el error de Railway: "npm: command not found"

## Problema
Railway está intentando usar Docker en lugar de NIXPACKS, causando el error "npm: command not found".

## Solución en Railway Dashboard

1. **Ve a la configuración del servicio en Railway:**
   - Abre tu proyecto en Railway
   - Selecciona el servicio de la rama `matiRama`
   - Ve a "Settings"

2. **Configura el Builder:**
   - Busca la sección "Build" o "Builder"
   - Asegúrate de que esté configurado como **"NIXPACKS"** (no Docker)
   - Si está en Docker, cámbialo a NIXPACKS

3. **Configura el Root Directory (si es necesario):**
   - Si tu servicio está en el directorio raíz del repo, no necesitas rootDirectory
   - Si tu servicio está en `frontend-ubold`, configura:
     - Root Directory: `frontend-ubold`

4. **Variables de entorno:**
   - Asegúrate de tener todas las variables configuradas:
     - `STRAPI_API_TOKEN`
     - `NEXT_PUBLIC_STRAPI_URL`
     - `WOOCOMMERCE_CONSUMER_KEY`
     - `WOOCOMMERCE_CONSUMER_SECRET`
     - `WOOCOMMERCE_URL`
     - `NODE_ENV=production`

5. **Start Command:**
   - Debe ser: `node server.js`

6. **Build Command (si es necesario):**
   - Debe ser: `npm run build`

## Archivos de configuración

El proyecto ya tiene:
- ✅ `railway.json` configurado con NIXPACKS
- ✅ `nixpacks.toml` con la configuración correcta
- ✅ `package.json` con los scripts necesarios

## Después de cambiar la configuración

1. Haz un nuevo deploy (Railway debería detectar el cambio automáticamente)
2. O haz un push nuevo a la rama `matiRama` para forzar un nuevo deploy

## Verificación

Una vez configurado correctamente, deberías ver en los logs:
- "Using NIXPACKS builder"
- "Installing dependencies..."
- "Building application..."
- "Starting application..."

En lugar de:
- "Using Dockerfile"
- "npm: command not found"

