# Configurar Variables de Entorno en Railway

## Variables Requeridas

Necesitas configurar las siguientes variables de entorno en Railway para que la aplicación funcione correctamente:

### 1. Variables de Strapi

#### `STRAPI_API_TOKEN`
- **Descripción**: Token de API de Strapi para autenticación
- **Cómo obtenerlo**:
  1. Ve a tu Strapi Admin: `https://strapi.moraleja.cl/admin`
  2. Ve a **Settings** → **Users & Permissions plugin** → **API Tokens**
  3. Crea un nuevo token o copia uno existente
  4. Asegúrate de que tenga permisos de **Read** o **Full access**
- **Ejemplo**: `abc123def456ghi789...`

#### `NEXT_PUBLIC_STRAPI_URL` (Opcional)
- **Descripción**: URL pública de Strapi
- **Valor por defecto**: `https://strapi.moraleja.cl`
- **Solo necesitas configurarla si es diferente**

### 2. Variables de WooCommerce

#### `WOOCOMMERCE_CONSUMER_KEY`
- **Descripción**: Clave de consumidor de WooCommerce API
- **Cómo obtenerlo**:
  1. Ve a tu WooCommerce Admin
  2. Ve a **WooCommerce** → **Settings** → **Advanced** → **REST API**
  3. Crea una nueva clave API o usa una existente
  4. Copia la **Consumer Key**
- **Ejemplo**: `ck_abc123def456...`

#### `WOOCOMMERCE_CONSUMER_SECRET`
- **Descripción**: Secreto de consumidor de WooCommerce API
- **Cómo obtenerlo**:
  1. En la misma página de REST API de WooCommerce
  2. Copia el **Consumer Secret**
- **Ejemplo**: `cs_xyz789uvw456...`

#### `NEXT_PUBLIC_WOOCOMMERCE_URL` (Opcional)
- **Descripción**: URL de tu tienda WooCommerce
- **Valor por defecto**: `https://staging.escolar.cl`
- **Solo necesitas configurarla si es diferente**

## Pasos para Configurar en Railway

### Opción 1: Desde Railway Dashboard (Recomendado)

1. **Accede a tu servicio en Railway:**
   - Ve a https://railway.app
   - Selecciona tu proyecto
   - Selecciona el servicio de la rama `matiRama`

2. **Ve a la sección de Variables:**
   - Haz clic en **"Variables"** en el menú lateral
   - O ve a **Settings** → **Variables**

3. **Agrega cada variable:**
   - Haz clic en **"+ New Variable"** o **"Add Variable"**
   - Ingresa el nombre de la variable (ej: `STRAPI_API_TOKEN`)
   - Ingresa el valor de la variable
   - Haz clic en **"Add"** o **"Save"**

4. **Repite para todas las variables necesarias:**
   - `STRAPI_API_TOKEN`
   - `WOOCOMMERCE_CONSUMER_KEY`
   - `WOOCOMMERCE_CONSUMER_SECRET`
   - `NEXT_PUBLIC_STRAPI_URL` (si es necesario)
   - `NEXT_PUBLIC_WOOCOMMERCE_URL` (si es necesario)

5. **Redeploy:**
   - Railway debería detectar los cambios automáticamente
   - O haz clic en **"Redeploy"** manualmente

### Opción 2: Usando Railway CLI

```bash
# Instalar Railway CLI (si no lo tienes)
npm i -g @railway/cli

# Login
railway login

# Configurar variables
railway variables set STRAPI_API_TOKEN=tu_token_aqui
railway variables set WOOCOMMERCE_CONSUMER_KEY=tu_key_aqui
railway variables set WOOCOMMERCE_CONSUMER_SECRET=tu_secret_aqui
```

## Verificar que Funcionan

Después de configurar las variables y hacer redeploy, deberías ver:

1. **Sin warnings en los logs:**
   - Los mensajes `⚠️ STRAPI_API_TOKEN no está configurado` deberían desaparecer
   - Los mensajes `⚠️ WooCommerce API credentials no están configuradas` deberían desaparecer

2. **Los productos se cargan correctamente:**
   - Ve a `/products` o `/tienda/productos`
   - Deberías ver los productos de Strapi

3. **El POS funciona:**
   - Si usas el POS, debería poder conectarse a WooCommerce

## Notas Importantes

- **Seguridad**: Nunca compartas tus tokens o credenciales públicamente
- **Variables Públicas**: Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente (navegador)
- **Variables Privadas**: Las variables sin `NEXT_PUBLIC_` solo están disponibles en el servidor
- **Redeploy**: Después de agregar/modificar variables, Railway necesita hacer redeploy para aplicarlas

## Troubleshooting

### Si los warnings persisten:
1. Verifica que las variables estén escritas correctamente (sin espacios, mayúsculas/minúsculas correctas)
2. Verifica que hayas hecho redeploy después de agregar las variables
3. Revisa los logs de Railway para ver si hay errores

### Si los productos no se cargan:
1. Verifica que `STRAPI_API_TOKEN` tenga permisos correctos en Strapi
2. Verifica que la colección `product-libro-edicion` tenga permisos públicos habilitados
3. Revisa los logs de Railway para ver errores específicos

