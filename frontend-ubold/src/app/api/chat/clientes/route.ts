/**
 * API Route para obtener clientes desde Strapi
 * Esto evita exponer el token de Strapi en el cliente
 */

import { NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import type { StrapiResponse, StrapiEntity } from '@/lib/strapi/types'

export const dynamic = 'force-dynamic'

interface WOClienteAttributes {
  nombre: string
  correo_electronico: string
  ultima_actividad?: string
  fecha_registro?: string
  pedidos?: number
  gasto_total?: number
}

export async function GET() {
  try {
    const response = await strapiClient.get<StrapiResponse<StrapiEntity<WOClienteAttributes>>>(
      '/api/wo-clientes?pagination[pageSize]=1000&sort=nombre:asc'
    )
    
    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('Error al obtener clientes:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener clientes' },
      { status: error.status || 500 }
    )
  }
}

