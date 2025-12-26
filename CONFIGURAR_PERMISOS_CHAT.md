# Configurar Permisos de Chat en Strapi

## Problema
Los usuarios no pueden ver los mensajes de chat porque no tienen permisos para leer el content type `intranet-chat`.

**NOTA:** El panel de Strapi tiene un error conocido donde `/api/users-permissions/roles` devuelve 500. Usa el método alternativo abajo.

## Solución Rápida: Usar Script (Recomendado)

Ejecuta el script que actualiza los permisos directamente:

```bash
node scripts/actualizar-permisos-chat-directo.js
```

Este script:
- Obtiene el rol "Authenticated" (ID: 1) directamente
- Habilita todos los permisos de `intranet-chat`
- Guarda los cambios

## Solución Alternativa: Configurar Permisos Manualmente

Si el panel de Strapi funciona, puedes configurarlos manualmente:

1. **Acceder al panel de administración de Strapi**
   - Ve a: `https://strapi.moraleja.cl/admin`
   - Inicia sesión con una cuenta de administrador

2. **Ir a Settings > Users & Permissions Plugin > Roles**
   - En el menú lateral, haz clic en "Settings"
   - Luego en "Users & Permissions Plugin"
   - Finalmente en "Roles"
   - **NOTA:** Si ves un error "Failed to fetch", el panel tiene un problema conocido. Usa el script en su lugar.

3. **Configurar permisos para el rol "Authenticated"**
   - Haz clic en el rol "Authenticated"
   - Busca la sección "Intranet-Chats" (o "intranet-chat")
   - Habilita los siguientes permisos:
     - ✅ **find** - Para leer/listar mensajes
     - ✅ **findOne** - Para leer un mensaje específico
     - ✅ **create** - Para crear/enviar mensajes
     - ✅ **update** - Para actualizar mensajes (opcional)
     - ✅ **delete** - Para eliminar mensajes (opcional)

4. **Guardar los cambios**
   - Haz clic en "Save" al final de la página

## Verificación

Después de configurar los permisos, los usuarios autenticados deberían poder:
- Ver mensajes donde son `remitente_id` o `cliente_id`
- Enviar nuevos mensajes
- Actualizar y eliminar sus propios mensajes (si se habilitó)

## Nota Importante

Los permisos en Strapi controlan qué operaciones puede realizar cada rol. Si los usuarios no pueden ver mensajes, es porque:
1. No tienen el permiso `find` habilitado
2. O hay una política personalizada que está bloqueando el acceso

Una vez configurados los permisos, el chat debería funcionar correctamente.

