# Estructura de Datos de Strapi - Colección Libros

## Estructura Real (basada en debug)

Los datos vienen **directamente** (sin `attributes` wrapper):

```json
{
  "id": 1,
  "documentId": "uzz2rgdspv57xvs7mgoy1aon",
  "isbn_libro": "B5454545",
  "nombre_libro": "hola",
  "subtitulo_libro": "chao",
  "descripcion": null,
  "numero_edicion": null,
  "agno_edicion": null,
  "idioma": null,
  "tipo_libro": null,
  "estado_edicion": "Vigente",
  "portada_libro": null,  // Puede ser null o un objeto con data
  "imagenes_interior": null,
  "precios": [],  // Array de objetos con attributes
  "stocks": [],   // Array de objetos con attributes
  "autor_relacion": null,  // Relación con data.attributes.nombre
  "editorial": null,       // Relación con data.attributes.nombre
  "createdAt": "2025-12-12T14:17:39.077Z",
  "updatedAt": "2025-12-12T15:06:26.011Z",
  "publishedAt": null
}
```

## Campos Editables

### Campos de Texto
- `nombre_libro` (string) - Nombre del libro
- `descripcion` (string | null) - Descripción del libro
- `subtitulo_libro` (string | null) - Subtítulo
- `isbn_libro` (string) - ISBN del libro

### Campos de Relación
- `portada_libro` (number | null) - ID de la imagen en Strapi Media Library
- `autor_relacion` (number | null) - ID del autor
- `editorial` (number | null) - ID de la editorial

### Campos de Array
- `precios` (array) - Array de precios con estructura `{ data: [{ attributes: { precio: number } }] }`
- `stocks` (array) - Array de stocks con estructura `{ data: [{ attributes: { cantidad: number } }] }`

## Formato de Actualización (PUT)

Strapi espera el formato:
```json
{
  "data": {
    "nombre_libro": "Nuevo nombre",
    "descripcion": "Nueva descripción",
    "portada_libro": 123  // ID de imagen en Strapi
  }
}
```

## Mapeo de Campos

| Campo Frontend | Campo Strapi | Tipo | Notas |
|----------------|--------------|------|-------|
| nombre | nombre_libro | string | Campo directo |
| descripción | descripcion | string | Campo directo |
| imagen | portada_libro | number (ID) | Relación con Media Library |
| autor | autor_relacion | number (ID) | Relación con colección Autor |
| editorial | editorial | number (ID) | Relación con colección Editorial |
| stock | stocks | array | Array de objetos con cantidad |
| precio | precios | array | Array de objetos con precio |

## Endpoints de Strapi

- **GET** `/api/libros?populate=*` - Obtener todos los libros
- **GET** `/api/libros/:id?populate=*` - Obtener un libro por ID
- **PUT** `/api/libros/:id` - Actualizar un libro
- **POST** `/api/libros` - Crear un libro
- **DELETE** `/api/libros/:id` - Eliminar un libro
- **POST** `/api/upload` - Subir imagen a Media Library

## Notas Importantes

1. Los datos vienen **directamente** sin `attributes` wrapper cuando se usa `populate=*`
2. Para actualizar, siempre usar formato `{ data: { campo: valor } }`
3. Las imágenes se asignan por ID numérico de la Media Library
4. Los arrays (precios, stocks) tienen estructura `{ data: [{ attributes: { ... } }] }`

