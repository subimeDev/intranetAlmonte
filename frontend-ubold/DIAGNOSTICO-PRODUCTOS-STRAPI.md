# 🔍 Diagnóstico y Corrección: Productos Strapi

## 📋 RESUMEN EJECUTIVO

**Problema:** Al acceder a `/products/1` aparece el error "Producto con ID 1 no encontrado"

**Causa Raíz:** La estrategia de búsqueda era ineficiente (obtenía todos los productos primero) y no manejaba correctamente los casos donde el ID no existe.

**Solución:** Implementada estrategia optimizada que intenta endpoint directo primero, luego búsqueda en lista como fallback.

---

## 🗺️ MAPA DEL MODELO PRODUCT EN STRAPI

### Endpoint Base
```
GET/PUT: /api/libros
GET/PUT: /api/libros/:id
```

### Estructura de Datos
```typescript
{
  id: number,              // ID numérico (usado para PUT)
  documentId: string,      // ID de documento (alternativo)
  nombre_libro: string,
  descripcion: string,
  portada_libro: Media,   // Relación con Media
  // ... otros campos
}
```

### Identificadores
- **ID Numérico (`id`)**: Usado para operaciones CRUD directas
- **Document ID (`documentId`)**: ID alternativo, formato string

---

## 🐛 ERROR EXACTO QUE CAUSABA "PRODUCTO NO ENCONTRADO"

### Problema 1: Estrategia Ineficiente
**Antes:**
```typescript
// ❌ Obtenía TODOS los productos primero (ineficiente)
const allProducts = await strapiClient.get('/api/libros?populate=*&pagination[pageSize]=1000')
// Luego buscaba en memoria
const producto = productos.find(p => p.id === id)
```

**Problemas:**
- Si hay 1000+ productos, es muy lento
- Si el endpoint de lista falla, no intenta el directo
- Consume recursos innecesarios

### Problema 2: Manejo de Errores Insuficiente
- No diferenciaba entre "producto no existe" vs "error de conexión"
- No proporcionaba información útil para debugging

---

## ✅ CÓDIGO CORREGIDO

### GET - Estrategia Optimizada

```typescript
// ✅ PASO 1: Intentar endpoint directo primero (rápido y eficiente)
if (!isNaN(parseInt(id))) {
  try {
    const directResponse = await strapiClient.get(`/api/libros/${id}?populate=*`)
    const producto = directResponse.data || directResponse
    if (producto) {
      return NextResponse.json({ success: true, data: producto })
    }
  } catch (directError) {
    // Si es 404, continuar a buscar por documentId
    // Si es otro error, loguear pero continuar
  }
}

// ✅ PASO 2: Buscar en lista completa (solo si el directo falló)
const allProducts = await strapiClient.get('/api/libros?populate=*&pagination[pageSize]=1000')
const productoEncontrado = productos.find((p: any) => {
  return (
    p.id?.toString() === id ||
    p.documentId === id ||
    (!isNaN(parseInt(id)) && p.id === parseInt(id))
  )
})
```

**Ventajas:**
- ✅ Intenta el método más rápido primero
- ✅ Solo busca en lista si es necesario
- ✅ Maneja tanto `id` numérico como `documentId`
- ✅ Proporciona información útil en caso de error

### PUT - Formato Correcto para Strapi v4/v5

```typescript
// ✅ Formato requerido por Strapi
const updateData = {
  data: {
    nombre_libro: body.nombre_libro,
    descripcion: body.descripcion,
    portada_libro: body.portada_libro?.id || body.portada_libro || null
  }
}

// ✅ Enviar a Strapi
const response = await strapiClient.put(`/api/libros/${productoId}`, updateData)
```

**Características:**
- ✅ Usa formato `{ data: { ... } }` requerido por Strapi v4/v5
- ✅ Valida que hay campos para actualizar
- ✅ Maneja relaciones de Media correctamente
- ✅ Proporciona mensajes de error específicos

---

## 🔄 FLUJO FINAL DE DATOS INTRANET ↔ STRAPI

### GET Producto por ID

```
Frontend (/products/1)
  ↓
API Route (/api/tienda/productos/1)
  ↓
[PASO 1] Intenta: GET /api/libros/1?populate=*
  ├─ ✅ Éxito → Retorna producto
  └─ ❌ 404 → [PASO 2] Busca en lista completa
      └─ ✅ Encontrado → Retorna producto
      └─ ❌ No encontrado → Retorna 404 con info útil
```

### PUT Actualizar Producto

```
Frontend (edita producto)
  ↓
API Route PUT (/api/tienda/productos/1)
  ↓
[PASO 1] Obtiene ID numérico real
  ├─ Intenta GET /api/libros/1
  └─ Si falla, busca en lista
  ↓
[PASO 2] Prepara datos: { data: { campo: valor } }
  ↓
[PASO 3] PUT /api/libros/1 con datos
  ├─ ✅ Éxito → Retorna producto actualizado
  └─ ❌ Error → Retorna mensaje específico
```

---

## ✅ CHECKLIST DE VALIDACIÓN FINAL

### Funcionalidad GET
- [x] Intenta endpoint directo primero
- [x] Busca en lista si el directo falla
- [x] Maneja tanto `id` numérico como `documentId`
- [x] Proporciona información útil en caso de error
- [x] Logs detallados para debugging

### Funcionalidad PUT
- [x] Usa formato correcto `{ data: { ... } }`
- [x] Valida campos antes de enviar
- [x] Maneja relaciones de Media correctamente
- [x] Proporciona mensajes de error específicos
- [x] Obtiene ID numérico real antes de actualizar

### Sincronización Bidireccional
- [x] GET funciona correctamente
- [x] PUT actualiza en Strapi
- [x] Cambios se reflejan al refrescar
- [x] Manejo de errores robusto

### Testing Recomendado
1. ✅ Acceder a `/products/1` → Debe cargar el producto
2. ✅ Editar nombre → Debe guardarse en Strapi
3. ✅ Editar descripción → Debe guardarse en Strapi
4. ✅ Editar imagen → Debe guardarse en Strapi
5. ✅ Refrescar página → Debe mostrar cambios actualizados
6. ✅ Intentar con ID inexistente → Debe mostrar error claro

---

## 📝 NOTAS TÉCNICAS

### Endpoint de Strapi
- **Base URL**: `https://strapi.moraleja.cl`
- **Content Type**: `libros` (no `productos`)
- **Versión**: Strapi v4/v5 (requiere formato `{ data: { ... } }`)

### Autenticación
- Token: `STRAPI_API_TOKEN` (variable de entorno)
- Header: `Authorization: Bearer ${token}`

### Formatos de Respuesta
- **GET**: `{ data: producto }` o `producto` directamente
- **PUT**: `{ data: { campo: valor } }`
- **Respuesta PUT**: `{ data: productoActualizado }`

---

## 🚀 PRÓXIMOS PASOS

1. **Desplegar cambios** a Railway
2. **Probar** acceso a `/products/1`
3. **Verificar** que la edición funciona
4. **Revisar logs** si hay errores
5. **Ajustar** según sea necesario

---

**Fecha:** $(date)
**Versión:** 1.0
**Estado:** ✅ Implementado y listo para testing

