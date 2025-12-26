# Guía de Prueba: Sincronización con WordPress

## Objetivo
Verificar que los productos creados desde la Intranet se sincronizan correctamente con WordPress cuando tienen canales asignados y estado "Publicado".

## Preparación

### 1. Abrir las herramientas de desarrollo
1. Abre la Intranet en el navegador
2. Presiona `F12` para abrir las herramientas de desarrollo
3. Ve a la pestaña **Console** (Consola)
4. Mantén la consola abierta durante toda la prueba

### 2. Verificar que los canales existen
1. Ve a la página de productos: `/products` o `/add-product`
2. Abre la pestaña **Network** (Red) en las herramientas de desarrollo
3. Busca una petición a `/api/tienda/canales`
4. Verifica que la respuesta contenga canales con `key: 'moraleja'` y `key: 'escolar'`

## Prueba 1: Crear Producto SIN Canales

### Pasos:
1. Ve a `/add-product` (Agregar Producto)
2. Completa el formulario:
   - **Nombre del libro**: "Prueba Sin Canales"
   - **ISBN**: "TEST-001"
   - **Precio**: 10000
   - **NO selecciones ningún canal** ← Importante
3. Haz clic en "Guardar" o "Crear Producto"
4. Revisa la consola del navegador

### Resultado Esperado:
```
═══════════════════════════════════════════════════════
[AddProduct] 📦 Payload que se envía a Strapi:
{
  "nombre_libro": "Prueba Sin Canales",
  ...
  // NO debe haber campo "canales"
}
[AddProduct] 🔍 Campos críticos:
  - Canales incluidos: ❌ NO HAY CANALES (el producto NO se sincronizará con WordPress)
═══════════════════════════════════════════════════════
```

### Verificación:
- ✅ El producto se crea en Strapi
- ❌ El producto NO aparece en WordPress (correcto, porque no tiene canales)
- ✅ Aparece la advertencia en la consola

## Prueba 2: Crear Producto CON Canales (Estado Pendiente)

### Pasos:
1. Ve a `/add-product`
2. Completa el formulario:
   - **Nombre del libro**: "Prueba Con Canales"
   - **ISBN**: "TEST-002"
   - **Precio**: 15000
   - **Selecciona al menos UN canal** (Moraleja o Escolar) ← Importante
3. Haz clic en "Guardar"
4. Revisa la consola del navegador

### Resultado Esperado:
```
═══════════════════════════════════════════════════════
[AddProduct] 📦 Payload que se envía a Strapi:
{
  "nombre_libro": "Prueba Con Canales",
  "canales": ["docId1", "docId2"],  ← Debe estar aquí
  ...
}
[AddProduct] 🔍 Campos críticos:
  - Canales incluidos: ["docId1", "docId2"]
  - Estado de publicación: Pendiente (por defecto)
═══════════════════════════════════════════════════════

═══════════════════════════════════════════════════════
[AddProduct] ✅ Respuesta de Strapi:
  - Status: 200
  - Success: true
  - Canales del libro: 1 canales (o 2)
  - Canales asignados: Moraleja (o Escolar, o ambos)
═══════════════════════════════════════════════════════
```

### Verificación:
- ✅ El producto se crea en Strapi
- ✅ Los canales se asignan correctamente
- ❌ El producto NO aparece en WordPress todavía (porque está "Pendiente")
- ✅ Aparece en Strapi Admin

## Prueba 3: Cambiar Estado a "Publicado"

### Pasos:
1. Ve a la página de **Solicitudes**: `/products/solicitudes`
2. Busca el producto "Prueba Con Canales"
3. Cambia el estado de "Pendiente" a **"Publicado"**
4. Guarda los cambios
5. Revisa los logs de Strapi (si tienes acceso)

### Resultado Esperado en Strapi:
```
[libro] 🔄 afterUpdate ejecutado para libro: 511
[libro] 📊 Estado anterior: Pendiente, Estado nuevo: Publicado
[libro] 🔍 Canales asignados: 1
[libro] 🚀 Iniciando sincronización con WordPress...
[libro] ✅ Sincronización exitosa
```

### Verificación:
- ✅ El estado cambia a "Publicado" en Strapi
- ✅ El producto aparece en WordPress (en el canal correspondiente)
- ✅ Puedes ver el producto en la tienda de WordPress

## Prueba 4: Verificar en WordPress

### Pasos:
1. Ve a la tienda de WordPress correspondiente:
   - **Moraleja**: `https://moraleja.cl` (o la URL correspondiente)
   - **Escolar**: `https://escolar.cl` (o la URL correspondiente)
2. Busca el producto "Prueba Con Canales"
3. Verifica que:
   - El nombre sea correcto
   - El precio sea correcto
   - La imagen se vea (si se subió)
   - El producto esté disponible para compra

## Checklist de Verificación Final

### En la Consola del Navegador:
- [ ] Se muestra el payload completo con canales
- [ ] Se muestra la advertencia si NO hay canales
- [ ] Se muestra la respuesta de Strapi con canales asignados
- [ ] No hay errores en la consola

### En Strapi:
- [ ] El producto aparece en Content Manager → Libros
- [ ] El producto tiene canales asignados
- [ ] El estado es correcto ("Pendiente" o "Publicado")

### En WordPress:
- [ ] El producto aparece cuando estado = "Publicado" Y tiene canales
- [ ] El producto NO aparece cuando estado = "Pendiente"
- [ ] El producto NO aparece cuando NO tiene canales

## Problemas Comunes y Soluciones

### Problema 1: No se muestran canales en el formulario
**Solución:**
- Verifica que `/api/tienda/canales` esté funcionando
- Revisa la pestaña Network para ver si hay errores
- Verifica que los canales existan en Strapi

### Problema 2: Los canales no se envían en el payload
**Solución:**
- Verifica que hayas seleccionado canales en el formulario
- Revisa la consola para ver si aparece la advertencia
- Verifica que `formData.canales` tenga valores

### Problema 3: El producto no aparece en WordPress
**Solución:**
- Verifica que el estado sea "Publicado" (no "Pendiente")
- Verifica que tenga canales asignados
- Revisa los logs de Strapi para ver si hay errores en la sincronización
- Verifica que los lifecycles de Strapi estén funcionando

### Problema 4: Error al crear el producto
**Solución:**
- Revisa la consola para ver el error específico
- Verifica que todos los campos requeridos estén completos
- Revisa los logs del servidor (backend)

## Logs a Revisar

### Consola del Navegador (F12 → Console):
- `[AddProduct] 📦 Payload que se envía a Strapi`
- `[AddProduct] ✅ Respuesta de Strapi`
- Cualquier error en rojo

### Logs del Servidor (si tienes acceso):
- `[API POST] ✅ PRODUCTO CREADO EXITOSAMENTE EN STRAPI`
- `[API POST] Canales: X canales asignados`
- `[libro] 🔄 afterUpdate ejecutado` (cuando cambias el estado)

### Logs de Strapi (si tienes acceso):
- `[libro] 🚀 Iniciando sincronización con WordPress...`
- `[libro] ✅ Sincronización exitosa` o `❌ Error en sincronización`

## Siguiente Paso

Si después de estas pruebas el producto NO aparece en WordPress:

1. **Comparte los logs de la consola** (F12 → Console)
2. **Comparte los logs del servidor** (si tienes acceso)
3. **Comparte los logs de Strapi** (si tienes acceso)
4. **Indica qué prueba falló** y qué resultado obtuviste

Con esa información podremos identificar exactamente dónde está el problema.

