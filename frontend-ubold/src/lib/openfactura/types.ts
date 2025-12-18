/**
 * Tipos TypeScript para OpenFactura.cl
 */

export interface OpenFacturaDocument {
  tipo: 'factura' | 'boleta' | 'nota_credito' | 'nota_debito'
  folio?: number
  fecha: string
  receptor: {
    rut: string
    razon_social?: string
    giro?: string
    direccion?: string
    comuna?: string
    ciudad?: string
    email?: string
  }
  items: Array<{
    nombre: string
    cantidad: number
    precio: number
    descuento?: number
    impuesto?: number
    codigo?: string
  }>
  descuento_global?: number
  observaciones?: string
  referencia?: string
}

export interface OpenFacturaEmitResponse {
  success: boolean
  folio?: number
  documento_id?: string
  pdf_url?: string
  xml_url?: string
  timbre?: string
  error?: string
  message?: string
}

export interface OpenFacturaConfig {
  razon_social: string
  rut: string
  giro?: string
  direccion?: string
  comuna?: string
  ciudad?: string
  telefono?: string
  email?: string
}
