# Solución: Railway no inicia el build automáticamente

## Problema
Railway no está detectando los cambios en la rama `matiRama` y no inicia el build automáticamente.

## Soluciones

### 1. Verificar la rama monitoreada en Railway
1. Ve a tu proyecto en Railway
2. Haz clic en el servicio "Intranet prueba mati"
3. Ve a la pestaña **Settings** o **Settings → Source**
4. Verifica que la **Branch** esté configurada como `matiRama` y no `main`
5. Si está en `main`, cámbiala a `matiRama` y guarda

### 2. Forzar despliegue manual
1. En Railway, ve a tu servicio
2. Haz clic en el botón **"Deploy"** o **"Redeploy"** (si está disponible)
3. O ve a **Deployments** y haz clic en **"Redeploy"** en el último despliegue

### 3. Verificar el webhook de GitHub
1. Ve a tu repositorio en GitHub: `https://github.com/subimeDev/intranetAlmonte`
2. Ve a **Settings → Webhooks**
3. Verifica que haya un webhook de Railway activo
4. Si no existe, Railway debería tener una opción para conectarlo desde su dashboard

### 4. Verificar que los cambios estén en GitHub
Los últimos commits pusheados son:
- `b4750b4` - Force rebuild: add version to railway.json
- `a3f6590` - Forzar nuevo despliegue: actualizar watchPatterns en railway.json
- `b526721` - Renombrar Dockerfile raíz para forzar uso de NIXPACKS

Verifica en GitHub que estos commits estén en la rama `matiRama`.

### 5. Cambios realizados para solucionar el problema
- ✅ Removido `cd frontend-ubold` del `startCommand` en `railway.json`
- ✅ Removidos comandos `cd` de `nixpacks.toml`
- ✅ Renombrado `Dockerfile` a `Dockerfile.backup` para forzar uso de NIXPACKS
- ✅ Configurado `rootDirectory: "frontend-ubold"` en `railway.json`
- ✅ `startCommand` ahora es simplemente `node server.js`

### 6. Si nada funciona
1. En Railway, desconecta y vuelve a conectar el repositorio de GitHub
2. Asegúrate de seleccionar la rama `matiRama` al reconectar
3. Railway debería iniciar un nuevo build automáticamente

## Configuración actual

### railway.json
```json
{
  "build": {
    "builder": "NIXPACKS",
    "rootDirectory": "frontend-ubold"
  },
  "deploy": {
    "startCommand": "node server.js"
  }
}
```

### nixpacks.toml
```toml
[start]
cmd = "node server.js"
```

Ambos archivos están configurados correctamente y sin comandos `cd`.

