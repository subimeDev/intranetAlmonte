# 🔧 Configuración de OpenFactura.cl

## 📋 Requisitos Previos

1. **Cuenta en OpenFactura.cl**
   - Registrarse en [OpenFactura.cl](https://www.openfactura.cl)
   - Obtener API Key desde el panel de administración
   - Verificar que la cuenta esté activa y habilitada

2. **Documentación de la API**
   - Revisar documentación oficial: https://www.openfactura.cl/factura-electronica/api/
   - Verificar endpoints y formato de datos requeridos

## ⚙️ Configuración de Variables de Entorno

Agregar las siguientes variables en `.env.local` o en el panel de Railway/Vercel:

```bash
# OpenFactura API Configuration
OPENFACTURA_API_KEY=tu_api_key_aqui
OPENFACTURA_API_URL=https://api.openfactura.cl
```

### Obtener API Key

1. Iniciar sesión en [OpenFactura.cl](https://www.openfactura.cl)
2. Ir a la sección de API o Configuración
3. Generar o copiar tu API Key
4. Pegarla en la variable de entorno `OPENFACTURA_API_KEY`

## 🔄 Flujo de Integración

### Automático en el POS

Cuando se procesa una venta en el POS:

1. Se crea el pedido en WooCommerce
2. **Automáticamente** se emite la factura electrónica en OpenFactura
3. Se imprime el ticket físico
4. Se limpia el carrito

### Datos que se envían a OpenFactura

- **Tipo de documento**: Boleta (por defecto) o Factura
- **Receptor**:
  - Si hay cliente: RUT, nombre, email, dirección
  - Si no hay cliente: "Consumidor Final" (RUT 66666666-6)
- **Items**: Productos del carrito con precios y cantidades
- **Descuentos**: Descuentos aplicados al pedido
- **Referencia**: ID del pedido de WooCommerce

## 📝 Endpoints Disponibles

### POST `/api/openfactura/emitir`

Emite una factura electrónica.

**Body:**
```json
{
  "tipo": "boleta",
  "fecha": "2024-01-15",
  "receptor": {
    "rut": "12345678-9",
    "razon_social": "Cliente Ejemplo",
    "email": "cliente@example.com"
  },
  "items": [
    {
      "nombre": "Producto 1",
      "cantidad": 2,
      "precio": 10000,
      "codigo": "SKU123"
    }
  ],
  "descuento_global": 0,
  "referencia": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "folio": 12345,
    "documento_id": "abc123",
    "pdf_url": "https://...",
    "xml_url": "https://...",
    "timbre": "..."
  }
}
```

### GET `/api/openfactura/emitir?folio=12345`

Consulta el estado de un documento emitido.

## 🛠️ Ajustes Necesarios

**IMPORTANTE**: La integración actual usa endpoints genéricos. Debes ajustar según la documentación oficial de OpenFactura:

1. **Revisar endpoints reales** en la documentación de OpenFactura
2. **Ajustar el cliente** en `src/lib/openfactura/client.ts` si el formato de autenticación es diferente
3. **Verificar formato de datos** en `src/app/api/openfactura/emitir/route.ts`
4. **Probar en entorno de desarrollo** antes de producción

## 🐛 Troubleshooting

### Error: "OpenFactura API Key no configurada"

- Verificar que `OPENFACTURA_API_KEY` esté configurada
- Verificar que la variable esté disponible en el entorno de ejecución
- En Railway/Vercel, verificar que esté en Variables de Entorno

### Error: "Error al emitir factura electrónica"

- Verificar que la API Key sea válida
- Revisar logs del servidor para más detalles
- Verificar formato de datos enviados
- Consultar documentación de OpenFactura para formato exacto

### La factura no se emite pero la venta sí

- Por diseño, si falla la emisión de factura, **no se bloquea la venta**
- Revisar logs para ver el error específico
- La venta se completa normalmente aunque falle la factura

## 📚 Recursos

- [OpenFactura.cl](https://www.openfactura.cl)
- [Documentación API](https://www.openfactura.cl/factura-electronica/api/)
- [Integración a la API](https://www.openfactura.cl/articulos/integrate-a-la-api-de-openfactura/)

## 🔐 Seguridad

- **NUNCA** commitees la API Key al repositorio
- Usa variables de entorno para almacenar credenciales
- Verifica que `.env.local` esté en `.gitignore`
- En producción, configura las variables en el panel de Railway/Vercel
