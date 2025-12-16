# 🔧 Configuración del Chat con Strapi

✅ **El content type `Intranet-Chats` ya ha sido creado en el código de Strapi.**

Esta guía te ayudará a verificar y configurar los permisos necesarios.

## 📋 Requisitos Previos

- Strapi funcionando y accesible
- Variables de entorno configuradas (`NEXT_PUBLIC_STRAPI_URL` y `STRAPI_API_TOKEN`)
- El content type `Intranet-Chats` debe estar disponible (ya creado en el código)

## ✅ Content Type: `Intranet-Chats` (Ya Creado)

### Paso 1: Reiniciar Strapi

El content type `Intranet-Chats` ya está creado en el código. Solo necesitas:

1. Reiniciar Strapi para que cargue el nuevo content type
2. Verificar que aparezca en el panel de administración

### Paso 2: Verificar Campos

El content type ya tiene los siguientes campos configurados:

Agrega los siguientes campos en este orden:

- ✅ `texto` (Text, requerido) - Contenido del mensaje
- ✅ `remitente_id` (Integer, requerido) - ID del usuario que envía
- ✅ `cliente_id` (Integer, requerido) - ID del cliente (WO-Cliente)
- ✅ `fecha` (DateTime, requerido) - Fecha y hora del mensaje
- ✅ `leido` (Boolean, default: false) - Estado de lectura

### Paso 3: Configurar Permisos

1. Ve a **Settings** → **Roles** → **Public** (o crea un rol "Intranet")
2. En la sección **Permissions**, busca `intranet-chat` o `Intranet-Chats`
3. Habilita los siguientes permisos:
   - ✅ `find` (leer lista de mensajes)
   - ✅ `findOne` (leer un mensaje)
   - ✅ `create` (crear mensajes)
   - ✅ `update` (actualizar mensajes - para marcar como leído)
   - ❌ `delete` (opcional, según necesites)

### Paso 4: Verificar

1. Guarda el content type
2. Reinicia Strapi si es necesario
3. Verifica que puedas crear un mensaje de prueba desde el panel de Strapi

## 🔍 Estructura del Content Type

```json
{
  "kind": "collectionType",
  "collectionName": "intranet_chats",
  "info": {
    "singularName": "intranet-chat",
    "pluralName": "intranet-chats",
    "displayName": "Intranet-Chats"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "texto": {
      "type": "text",
      "required": true
    },
    "remitente_id": {
      "type": "integer",
      "required": true
    },
    "cliente_id": {
      "type": "integer",
      "required": true
    },
    "fecha": {
      "type": "datetime",
      "required": true
    },
    "leido": {
      "type": "boolean",
      "default": false
    }
  }
}
```

## 🧪 Probar la Conexión

1. Inicia tu aplicación Next.js: `npm run dev`
2. Ve a: `http://localhost:3000/chat`
3. Deberías ver la lista de clientes desde `WO-Clientes`
4. Selecciona un cliente y envía un mensaje de prueba
5. Verifica en Strapi que el mensaje se haya creado

## ⚙️ Configuración de Variables de Entorno

Asegúrate de tener estas variables en `.env.local`:

```env
NEXT_PUBLIC_STRAPI_URL=https://strapi.moraleja.cl
STRAPI_API_TOKEN=tu_token_aqui
```

## 🐛 Solución de Problemas

### Error: "404 Not Found" al obtener mensajes
- Verifica que el content type se llame exactamente `intranet-chats`
- Reinicia Strapi para que cargue el nuevo content type
- Verifica los permisos en Strapi (Settings → Roles → Public)

### Error: "401 Unauthorized"
- Verifica que `STRAPI_API_TOKEN` esté configurado
- Verifica que el token tenga los permisos necesarios

### No aparecen clientes
- Verifica que existan registros en `WO-Clientes` en Strapi
- Verifica que los permisos de `wo-cliente` estén habilitados

### Los mensajes no se actualizan
- El polling está configurado para ejecutarse cada 1 segundo
- Verifica la consola del navegador para ver errores
- Verifica que el content type tenga el campo `fecha` correctamente configurado

## 📝 Notas

- El polling se ejecuta cada **1 segundo** para obtener nuevos mensajes
- Los mensajes se ordenan por fecha ascendente
- El usuario actual tiene ID `1` por defecto (puedes cambiarlo en `CURRENT_USER_ID` en `page.tsx`)
- Los mensajes se marcan automáticamente como leídos cuando se cargan

## 🔄 Próximos Pasos (Opcional)

- Implementar autenticación real para obtener el ID del usuario actual
- Agregar notificaciones push cuando lleguen nuevos mensajes
- Implementar WebSockets para tiempo real (sin polling)
- Agregar soporte para archivos/imágenes en los mensajes

