# Guía de Prueba: Sistema de Logs con Usuario

## 🎯 Objetivo
Verificar que los logs se creen correctamente con el usuario asociado (no `usuario: null`).

## 📋 Pasos para Probar

### 1. Preparación

**A. Verificar que el servidor esté corriendo:**
```bash
cd frontend-ubold
npm run dev
```

**B. Abrir la consola del navegador:**
- Presiona `F12` o `Ctrl+Shift+I`
- Ve a la pestaña **Console**

**C. Abrir la terminal del servidor:**
- Debe mostrar los logs de Next.js
- Busca mensajes que empiecen con `[LOGGING]` o `[API /auth/login]`

### 2. Limpiar Estado Anterior

**A. Cerrar sesión (si estás logueado):**
- Ve a `/logout` o cierra sesión desde la aplicación
- Esto asegura que la cookie antigua se elimine

**B. Limpiar cookies del navegador (opcional pero recomendado):**
- DevTools → Application → Cookies
- Eliminar todas las cookies del dominio
- O usar modo incógnito para una prueba limpia

### 3. Iniciar Sesión

**A. Ir a la página de login:**
- `/login` o la ruta de login de tu aplicación

**B. Iniciar sesión con un usuario de prueba:**
- Email: `prueba@prueba.com` (o el que uses para pruebas)
- Contraseña: (la contraseña del usuario)

**C. Revisar logs del servidor:**
Busca estos mensajes en la terminal del servidor:

```
[API /auth/login] 💾 Estructura del colaborador ANTES de guardar en cookie:
  - estructuraParaCookie: { id: 119, email_login: "prueba@prueba.com", ... }
  - tieneId: true
  - id: 119

[API /auth/login] 💾 Valor de cookie a guardar (primeros 200 chars): {"id":119,"email_login":"prueba@prueba.com",...}

[API /auth/login] ✅ Cookie guardada exitosamente con ID: 119
```

**✅ Verificación:**
- Debe aparecer `tieneId: true`
- El `id` debe ser un número (ej: `119`)
- No debe haber estructuras anidadas como `data.attributes`

### 4. Realizar una Acción que Genere Log

**A. Editar un producto:**
- Ve a `/products` o la lista de productos
- Haz clic en "Editar" en cualquier producto
- Modifica algún campo (ej: nombre, precio)
- Guarda los cambios

**B. O realizar otra acción:**
- Ver productos
- Eliminar un producto (si tienes permisos)
- Crear un nuevo producto

### 5. Revisar Logs del Servidor

Busca estos mensajes en la terminal del servidor (en orden):

**Paso 1: Extracción de usuario:**
```
[LOGGING] 📋 Cookie colaboradorData: {"id":119,"email_login":"prueba@prueba.com",...}
[LOGGING] 👤 Colaborador parseado: { id: 119, email_login: "prueba@prueba.com", ... }
[LOGGING] 🔑 ID encontrado: 119
[LOGGING] ✅ Usuario extraído: { id: 119, email: "prueba@prueba.com", nombre: "..." }
```

**Paso 2: Asociación al log:**
```
[LOGGING] 🎯 Usuario obtenido para log: { id: 119, email: "prueba@prueba.com", nombre: "..." }
[LOGGING] ✅ Usuario asociado al log: {
  idOriginal: 119,
  idConvertido: 119,
  tipoUsuario: "number",
  esNumero: true
}
```

**Paso 3: Envío a Strapi:**
```
[LOGGING] 📤 Log a enviar a Strapi: {
  "data": {
    "usuario": 119,  ← DEBE SER NÚMERO, NO STRING NI OBJETO
    "accion": "actualizar",
    "entidad": "producto",
    ...
  }
}
```

**Paso 4: Respuesta de Strapi:**
```
[LOGGING] ✅ Log creado exitosamente en Strapi: {
  logId: 127,
  usuarioEnviado: 119,
  usuarioEnRespuesta: { id: 119, ... }  ← DEBE TENER EL USUARIO
}
```

**✅ Verificaciones importantes:**
- `esNumero: true` en "Usuario asociado al log"
- `"usuario": 119` (número) en "Log a enviar a Strapi"
- `usuarioEnRespuesta` debe tener el ID del colaborador (no null)

### 6. Verificar en Strapi

**A. Ir al panel de Strapi:**
- URL: `https://strapi.moraleja.cl` (o tu URL de Strapi)
- Content Manager → Activity Logs (o Log de Actividades)

**B. Buscar el log más reciente:**
- Debe tener `accion: "actualizar"` (o la acción que realizaste)
- Debe tener `entidad: "producto"` (o la entidad que modificaste)

**C. Verificar el campo `usuario`:**
- Debe mostrar el colaborador con ID 119 (o el ID de tu usuario)
- NO debe ser `null`
- Debe tener `email_login: "prueba@prueba.com"`

### 7. Verificar en la Tabla de Logs

**A. Ir a la página de logs:**
- `/logs` en tu aplicación

**B. Verificar la tabla:**
- Debe aparecer una entrada con tu email: `prueba@prueba.com`
- El nombre debe ser el nombre completo de la persona
- NO debe aparecer "Usuario Anónimo" para tu usuario

**C. Ver detalles:**
- Haz clic en el botón de acciones (icono de documento)
- Debe llevarte a `/logs/usuario/119` (o el ID de tu usuario)
- En la tabla de actividades, la columna "Usuario / Email" debe mostrar `prueba@prueba.com`

## 🐛 Problemas Comunes y Soluciones

### Problema 1: `tieneId: false` en login
**Síntoma:** El log muestra que no se encontró ID al guardar la cookie.

**Solución:**
- Verificar que Strapi devuelva el colaborador con `id` o `documentId`
- Revisar la respuesta de `/api/colaboradores/login` en Strapi

### Problema 2: `esNumero: false` en logActivity
**Síntoma:** El usuario no se convierte a número.

**Solución:**
- Verificar que `user.id` sea un número antes de convertirlo
- Revisar el log `[LOGGING] ✅ Usuario extraído` para ver el tipo de `id`

### Problema 3: `usuarioEnRespuesta: null` en respuesta de Strapi
**Síntoma:** El log se crea pero el usuario es null en Strapi.

**Posibles causas:**
- El campo `usuario` es required en Strapi y no acepta null
- El ID enviado no existe en la colección Colaboradores
- Error en la relación manyToOne en Strapi

**Solución:**
- Verificar en Strapi que el colaborador con ID 119 exista
- Verificar que la relación `usuario` en Activity Log esté configurada correctamente
- Considerar hacer el campo `usuario` opcional temporalmente para debugging

### Problema 4: Cookie no se encuentra
**Síntoma:** `⚠️ No se encontró cookie colaboradorData ni colaborador`

**Solución:**
- Verificar que las cookies se estén guardando (DevTools → Application → Cookies)
- Verificar que `httpOnly: false` en la configuración de cookies
- Verificar que el dominio de las cookies sea correcto

## 📊 Checklist de Verificación

- [ ] Login muestra `tieneId: true` y `id: 119` (o tu ID)
- [ ] Cookie se guarda con estructura limpia (sin `data.attributes`)
- [ ] `getUserFromRequest` encuentra el ID: `🔑 ID encontrado: 119`
- [ ] `logActivity` muestra `esNumero: true`
- [ ] Body enviado a Strapi tiene `"usuario": 119` (número)
- [ ] Respuesta de Strapi muestra `usuarioEnRespuesta` con el ID
- [ ] En Strapi, el log tiene `usuario: { id: 119, ... }` (no null)
- [ ] En la tabla `/logs`, aparece tu email y nombre
- [ ] En `/logs/usuario/119`, la columna "Usuario / Email" muestra tu email

## 🎬 Comandos Útiles para Debugging

**Ver logs en tiempo real (si usas nodemon o similar):**
```bash
# En la terminal del servidor, filtra solo los logs relevantes
# (depende de tu sistema operativo)
```

**Verificar cookies en el navegador:**
```javascript
// En la consola del navegador (F12)
document.cookie
// Debe incluir: colaboradorData={"id":119,...}
```

**Verificar estructura de la cookie:**
```javascript
// En la consola del navegador
JSON.parse(document.cookie.split('colaboradorData=')[1]?.split(';')[0] || '{}')
// Debe mostrar: { id: 119, email_login: "prueba@prueba.com", ... }
```

## 📝 Qué Compartir si Hay Problemas

Si algo no funciona, comparte:

1. **Logs del servidor** (los mensajes con `[LOGGING]` y `[API /auth/login]`)
2. **Estructura de la cookie** (desde DevTools → Application → Cookies)
3. **Respuesta de Strapi** (el log `[LOGGING] ✅ Log creado exitosamente`)
4. **Screenshot de Strapi** (mostrando el log con `usuario: null`)

Con esta información podremos identificar exactamente dónde falla el proceso.

