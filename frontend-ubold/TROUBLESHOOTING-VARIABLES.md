# Troubleshooting: Variables de Entorno en Railway

## Problema: Los warnings persisten después de configurar las variables

Si configuraste las variables pero sigues viendo los warnings, sigue estos pasos:

## ✅ Checklist de Verificación

### 1. Verificar que las variables estén en el servicio correcto

En Railway, las variables pueden estar configuradas a nivel de:
- **Proyecto** (heredadas por todos los servicios)
- **Servicio** (específicas del servicio)

**Pasos:**
1. Ve a tu servicio específico de `matiRama` en Railway
2. Ve a **Variables**
3. Verifica que las variables estén listadas ahí (no solo en el proyecto)

### 2. Verificar nombres exactos de las variables

Los nombres deben ser **exactamente** estos (case-sensitive):

- ✅ `STRAPI_API_TOKEN` (no `STRAPI_TOKEN` ni `strapi_api_token`)
- ✅ `WOOCOMMERCE_CONSUMER_KEY` (no `WOOCOMMERCE_KEY`)
- ✅ `WOOCOMMERCE_CONSUMER_SECRET` (no `WOOCOMMERCE_SECRET`)

### 3. Verificar que los valores no tengan espacios

- ❌ ` ck_abc123...` (espacio al inicio)
- ✅ `ck_abc123...` (sin espacios)

### 4. Hacer Redeploy completo

Después de agregar/modificar variables:

1. Ve a **Deployments**
2. Haz clic en **"Redeploy"** o **"Deploy"**
3. Espera a que termine el build completo

**Importante:** Solo agregar la variable no es suficiente, necesitas hacer redeploy.

### 5. Verificar en los logs

Después del redeploy, revisa los logs:

1. Ve a **Logs** en Railway
2. Busca si las variables están siendo leídas
3. Si ves los warnings, significa que las variables no están disponibles

## 🔍 Verificación Rápida

Puedes crear una ruta de prueba temporal para verificar las variables:

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    hasStrapiToken: !!process.env.STRAPI_API_TOKEN,
    hasWooCommerceKey: !!process.env.WOOCOMMERCE_CONSUMER_KEY,
    hasWooCommerceSecret: !!process.env.WOOCOMMERCE_CONSUMER_SECRET,
    nodeEnv: process.env.NODE_ENV,
  })
}
```

Luego visita: `https://tu-url-railway.up.railway.app/api/test-env`

## 🚨 Problemas Comunes

### Problema 1: Variables configuradas pero no disponibles

**Causa:** Las variables están en el proyecto pero no en el servicio específico.

**Solución:** Agrega las variables directamente en el servicio de `matiRama`.

### Problema 2: Variables con espacios o caracteres especiales

**Causa:** Al copiar/pegar, pueden agregarse espacios invisibles.

**Solución:** 
1. Elimina la variable
2. Vuelve a crearla escribiendo el valor manualmente
3. No copies/pegues directamente

### Problema 3: Next.js no detecta las variables

**Causa:** Next.js necesita rebuild para detectar nuevas variables.

**Solución:** 
1. Haz un cambio mínimo en el código (ej: agregar un espacio)
2. Haz commit y push
3. Esto forzará un rebuild completo

### Problema 4: Variables solo disponibles en runtime

**Causa:** Algunas variables se cargan en build time, otras en runtime.

**Solución:** Las variables sin `NEXT_PUBLIC_` están disponibles en runtime. Asegúrate de hacer redeploy después de agregarlas.

## 📝 Pasos Recomendados

1. **Elimina las variables actuales** (si existen)
2. **Vuelve a crearlas** con los nombres exactos
3. **Verifica que no tengan espacios**
4. **Haz redeploy completo**
5. **Espera a que termine el build**
6. **Revisa los logs** para confirmar

## 🔐 Valores que debes tener configurados

```
STRAPI_API_TOKEN = [tu token de Strapi]
WOOCOMMERCE_CONSUMER_KEY = ck_ead4ac3a050feefe4f4507412117571ece3547da
WOOCOMMERCE_CONSUMER_SECRET = cs_302d947602fe2a43bf79ac742805a1b864267748
```

## 💡 Nota Importante

Los warnings aparecen durante el **build time** o **startup time**. Si las variables se agregan después del build, necesitas hacer un nuevo build (redeploy) para que se detecten.

