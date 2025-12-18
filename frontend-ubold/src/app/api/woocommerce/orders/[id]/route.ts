/**
 * API Route para actualizar pedidos en WooCommerce
 * Permite actualizar pedidos con facturas electrónicas y datos adicionales
 */

import { NextRequest, NextResponse } from 'next/server'
import wooCommerceClient from '@/lib/woocommerce/client'
import type { WooCommerceOrder } from '@/lib/woocommerce/types'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/woocommerce/orders/[id]
 * Actualiza un pedido existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    const body = await request.json()

    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de pedido inválido',
        },
        { status: 400 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}

    // Actualizar billing si viene
    if (body.billing) {
      updateData.billing = {
        first_name: body.billing.first_name || '',
        last_name: body.billing.last_name || '',
        company: body.billing.company || '',
        address_1: body.billing.address_1 || '',
        address_2: body.billing.address_2 || '',
        city: body.billing.city || '',
        state: body.billing.state || '',
        postcode: body.billing.postcode || '',
        country: body.billing.country || 'CL',
        email: body.billing.email || '',
        phone: body.billing.phone || '',
      }
    }

    // Actualizar shipping si viene
    if (body.shipping) {
      updateData.shipping = {
        first_name: body.shipping.first_name || '',
        last_name: body.shipping.last_name || '',
        company: body.shipping.company || '',
        address_1: body.shipping.address_1 || '',
        address_2: body.shipping.address_2 || '',
        city: body.shipping.city || '',
        state: body.shipping.state || '',
        postcode: body.shipping.postcode || '',
        country: body.shipping.country || 'CL',
      }
    }

    // Actualizar meta_data si viene
    // Nota: WooCommerce requiere que se envíen TODOS los meta_data existentes
    // Si solo envías algunos, los demás se eliminan
    // Por eso, obtenemos los meta_data existentes y los combinamos con los nuevos
    if (body.meta_data && Array.isArray(body.meta_data)) {
      try {
        // Obtener pedido actual para preservar meta_data existente
        const currentOrder = await wooCommerceClient.get(`orders/${orderId}`)
        const existingMetaData = (currentOrder as any).meta_data || []
        
        // Combinar: mantener existentes y agregar/actualizar nuevos
        const newKeys = new Set(body.meta_data.map((m: any) => m.key))
        const combinedMetaData = [
          ...existingMetaData.filter((m: any) => !newKeys.has(m.key)),
          ...body.meta_data,
        ]
        
        updateData.meta_data = combinedMetaData
      } catch (error) {
        // Si falla obtener el pedido, usar solo los nuevos meta_data
        console.warn('[API] No se pudo obtener pedido actual, usando solo nuevos meta_data')
        updateData.meta_data = body.meta_data
      }
    }

    // Actualizar customer_note si viene
    if (body.customer_note !== undefined) {
      updateData.customer_note = body.customer_note
    }

    console.log('[API] Actualizando pedido:', {
      orderId,
      hasBilling: !!updateData.billing,
      hasShipping: !!updateData.shipping,
      metaDataCount: updateData.meta_data?.length || 0,
    })

    // Actualizar pedido en WooCommerce
    const order = await wooCommerceClient.put<WooCommerceOrder>(
      `orders/${orderId}`,
      updateData
    )

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error: any) {
    console.error('Error al actualizar pedido en WooCommerce:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al actualizar pedido',
        status: error.status || 500,
        details: error.details,
      },
      { status: error.status || 500 }
    )
  }
}

/**
 * GET /api/woocommerce/orders/[id]
 * Obtiene un pedido específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de pedido inválido',
        },
        { status: 400 }
      )
    }

    const order = await wooCommerceClient.get<WooCommerceOrder>(
      `orders/${orderId}`
    )

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error: any) {
    console.error('Error al obtener pedido de WooCommerce:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener pedido',
        status: error.status || 500,
      },
      { status: error.status || 500 }
    )
  }
}
