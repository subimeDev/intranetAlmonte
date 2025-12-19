# Integración con Shipit

Este módulo proporciona la integración completa con la API de Shipit para gestionar envíos desde pedidos de WooCommerce.

## Configuración

### Variables de Entorno

Agrega las siguientes variables a tu archivo `.env` o variables de entorno del servidor:

```env
# Shipit API Configuration
SHIPIT_API_TOKEN=tu_token_aqui
SHIPIT_API_URL=https://api.shipit.cl/v4
SHIPIT_API_EMAIL=tu_email@ejemplo.com  # REQUERIDO - Email con el que te registraste en Shipit
```

**Importante:** El `SHIPIT_API_EMAIL` es **requerido** para la autenticación. Shipit API v4 usa headers personalizados:
- `X-Shipit-Email`: Tu email de cuenta
- `X-Shipit-Access-Token`: Tu token de acceso

### Obtener Credenciales

1. Crear cuenta en [Shipit](https://shipit.cl/)
2. Acceder a la sección de configuración de API
3. Generar o copiar el Token de Acceso
4. Copiar el email asociado a la cuenta (si es necesario)

## Uso

### Crear un Envío desde un Pedido de WooCommerce

```typescript
import { shipitClient } from '@/lib/shipit'
import { mapWooCommerceOrderToShipit } from '@/lib/shipit/utils'

// Obtener pedido de WooCommerce
const order = await wooCommerceClient.get(`orders/${orderId}`)

// Mapear a formato Shipit
const shipmentData = mapWooCommerceOrderToShipit(order, {
  communeId: 308, // ID de comuna (requerido)
  courier: 'shippify',
  kind: 0, // 0: normal, 1: express, 2: same_day
  testMode: false
})

// Crear envío
const shipment = await shipitClient.post('shipments', shipmentData)
```

### Consultar Estado de un Envío

```typescript
const status = await shipitClient.get(`shipments/${shipmentId}/status`)
```

### Usar los Endpoints API

#### Crear Envío
```bash
POST /api/shipit/shipments
Content-Type: application/json

{
  "orderId": 123,
  "communeId": 308,
  "courier": "shippify",
  "kind": 0,
  "testMode": false
}
```

#### Consultar Estado
```bash
GET /api/shipit/shipments/456/status
```

#### Verificar Cobertura
```bash
GET /api/shipit/coverage?commune_id=308
```

## Mapeo de Comunas

Shipit requiere el `commune_id` (ID numérico) de las comunas de Chile. El módulo incluye un mapeo completo de comunas chilenas.

### Uso Automático

El mapeo se usa automáticamente al crear envíos desde pedidos de WooCommerce:

```typescript
import { mapWooCommerceOrderToShipit } from '@/lib/shipit/utils'

// El mapeo se aplica automáticamente desde order.shipping.city
const shipmentData = mapWooCommerceOrderToShipit(order, {
  // communeId es opcional si la ciudad está en el mapeo
  courier: 'shippify',
  kind: 0,
})
```

### Uso Manual

Si necesitas obtener el ID de una comuna manualmente:

```typescript
import { getCommuneId, getCommuneInfo } from '@/lib/shipit/communes'

// Obtener ID de comuna
const communeId = getCommuneId('LAS CONDES') // Retorna 308
const communeId2 = getCommuneId('las condes') // También funciona (case-insensitive)
const communeId3 = getCommuneId('SANTIAGO') // Retorna 131

// Obtener información completa
const info = getCommuneInfo('PROVIDENCIA')
// { id: 131, name: 'PROVIDENCIA', province: 'Santiago', region: 'Región Metropolitana' }
```

### Comunas Incluidas

El mapeo incluye más de 200 comunas de todas las regiones de Chile:
- Región Metropolitana (Santiago, Las Condes, Providencia, Maipú, etc.)
- Región de Valparaíso (Valparaíso, Viña del Mar, Quilpué, etc.)
- Región de O'Higgins (Rancagua, San Fernando, etc.)
- Región del Maule (Talca, Curicó, Linares, etc.)
- Región del Biobío (Concepción, Talcahuano, Los Ángeles, Chillán, etc.)
- Y todas las demás regiones

### Agregar Nuevas Comunas

Si una comuna no está en el mapeo, puedes agregarla editando `communes.ts`:

```typescript
export const communeMap: Record<string, number> = {
  // ... comunas existentes
  'NUEVA COMUNA': 999, // Agregar nueva comuna
}
```

O puedes proporcionar el `communeId` manualmente al crear el envío:

```typescript
const shipmentData = mapWooCommerceOrderToShipit(order, {
  communeId: 999, // ID manual
  courier: 'shippify',
})
```

## Webhooks

Configura el webhook en el panel de Shipit apuntando a:
```
https://tu-dominio.com/api/shipit/webhooks
```

El webhook recibirá notificaciones automáticas cuando cambie el estado de un envío y actualizará automáticamente el pedido en WooCommerce.

## Modo de Prueba

Para probar sin crear envíos reales, usa `testMode: true` al crear el envío. Esto agregará el prefijo "TEST-" a la referencia del pedido.

## Archivos

- `config.ts` - Configuración y variables de entorno
- `client.ts` - Cliente HTTP para la API de Shipit
- `types.ts` - Tipos TypeScript
- `utils.ts` - Utilidades para mapeo de datos
- `index.ts` - Exportaciones del módulo

## Endpoints API

- `GET /api/shipit/test` - Probar conexión y configuración
- `GET /api/shipit/shipments` - Listar envíos
- `POST /api/shipit/shipments` - Crear envío
- `GET /api/shipit/shipments/[id]` - Obtener envío
- `GET /api/shipit/shipments/[id]/status` - Estado del envío
- `POST /api/shipit/webhooks` - Recibir webhooks
- `GET /api/shipit/coverage` - Verificar cobertura

### Probar Conexión

Una vez configuradas las variables de entorno, puedes probar la conexión:

```bash
GET /api/shipit/test
```

Este endpoint verifica:
- Que las credenciales estén configuradas
- Que la autenticación funcione correctamente
- Que la conexión con Shipit API sea exitosa

## Documentación

- [Documentación API Shipit](https://developers.shipit.cl/)
- [Guía de Integración](https://developers.shipit.cl/docs/paso-a-paso)
- [Referencia de Endpoints](https://developers.shipit.cl/v4/reference)
