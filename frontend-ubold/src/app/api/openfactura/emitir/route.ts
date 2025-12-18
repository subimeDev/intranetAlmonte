/**
 * API Route para emitir facturas electrónicas a través de OpenFactura.cl
 */

import { NextRequest, NextResponse } from 'next/server'
import openFacturaClient from '@/lib/openfactura/client'
import type { OpenFacturaDocument, OpenFacturaEmitResponse } from '@/lib/openfactura/types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/openfactura/emitir
 * Emite una factura electrónica a través de OpenFactura
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos requeridos
    if (!body.receptor || !body.receptor.rut) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere el RUT del receptor',
        },
        { status: 400 }
      )
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere al menos un item en la factura',
        },
        { status: 400 }
      )
    }

    // Preparar documento para OpenFactura
    const documento: OpenFacturaDocument = {
      tipo: body.tipo || 'boleta', // Por defecto boleta (sin IVA para consumidor final)
      fecha: body.fecha || new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
      receptor: {
        rut: body.receptor.rut.replace(/[.-]/g, ''), // Limpiar formato del RUT
        razon_social: body.receptor.razon_social,
        giro: body.receptor.giro,
        direccion: body.receptor.direccion,
        comuna: body.receptor.comuna,
        ciudad: body.receptor.ciudad,
        email: body.receptor.email,
      },
      items: body.items.map((item: any) => ({
        nombre: item.nombre || item.name,
        cantidad: item.cantidad || item.quantity,
        precio: item.precio || item.price,
        descuento: item.descuento || 0,
        impuesto: item.impuesto || 0, // IVA u otro impuesto
        codigo: item.codigo || item.sku,
      })),
      descuento_global: body.descuento_global || 0,
      observaciones: body.observaciones || body.customer_note,
      referencia: body.referencia || body.order_id?.toString(),
    }

    console.log('[OpenFactura] Emitiendo documento:', {
      tipo: documento.tipo,
      receptor: documento.receptor.rut,
      items: documento.items.length,
    })

    // Emitir documento en OpenFactura
    // Nota: El endpoint exacto puede variar según la documentación de OpenFactura
    // Ajustar según la documentación oficial: https://www.openfactura.cl/factura-electronica/api/
    const response = await openFacturaClient.post<OpenFacturaEmitResponse>(
      '/v1/dte/emitir', // Ajustar según la documentación real
      documento
    )

    if (response.success) {
      console.log('[OpenFactura] Documento emitido exitosamente:', {
        folio: response.folio,
        documento_id: response.documento_id,
      })

      return NextResponse.json({
        success: true,
        data: {
          folio: response.folio,
          documento_id: response.documento_id,
          pdf_url: response.pdf_url,
          xml_url: response.xml_url,
          timbre: response.timbre,
        },
      })
    } else {
      throw new Error(response.error || response.message || 'Error al emitir documento')
    }
  } catch (error: any) {
    console.error('[OpenFactura] Error al emitir documento:', {
      message: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al emitir factura electrónica',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: error.status || 500 }
    )
  }
}

/**
 * GET /api/openfactura/emitir
 * Obtener estado de un documento emitido
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folio = searchParams.get('folio')
    const documento_id = searchParams.get('documento_id')

    if (!folio && !documento_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere folio o documento_id',
        },
        { status: 400 }
      )
    }

    // Consultar estado del documento
    const response = await openFacturaClient.get<OpenFacturaEmitResponse>(
      `/v1/dte/consultar`,
      { folio, documento_id }
    )

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error: any) {
    console.error('[OpenFactura] Error al consultar documento:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al consultar documento',
      },
      { status: error.status || 500 }
    )
  }
}
