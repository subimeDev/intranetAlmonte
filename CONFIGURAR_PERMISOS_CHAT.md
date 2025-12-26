# Configurar Permisos de Chat en Strapi

## Problema
Los usuarios no pueden ver los mensajes de chat porque no tienen permisos para leer el content type `intranet-chat`.

## Solución: Configurar Permisos Manualmente

### Pasos:

1. **Acceder al panel de administración de Strapi**
   - Ve a: `https://strapi.moraleja.cl/admin`
   - Inicia sesión con una cuenta de administrador

2. **Ir a Settings > Users & Permissions Plugin > Roles**
   - En el menú lateral, haz clic en "Settings"
   - Luego en "Users & Permissions Plugin"
   - Finalmente en "Roles"

3. **Configurar permisos para el rol "Authenticated"**
   - Haz clic en el rol "Authenticated"
   - Busca la sección "Intranet-Chats" (o "intranet-chat")
   - Habilita los siguientes permisos:
     - ✅ **find** - Para leer/listar mensajes
     - ✅ **findOne** - Para leer un mensaje específico
     - ✅ **create** - Para crear/enviar mensajes
     - ✅ **update** - Para actualizar mensajes (opcional)
     - ✅ **delete** - Para eliminar mensajes (opcional)

4. **Configurar permisos para el rol "Public" (si es necesario)**
   - Repite el mismo proceso para el rol "Public" si quieres que usuarios no autenticados también puedan acceder
   - **NOTA:** Generalmente solo se habilita para "Authenticated"

5. **Guardar los cambios**
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

