import { NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import type { StrapiResponse, StrapiEntity } from '@/lib/strapi/types'

export const dynamic = 'force-dynamic'

interface ColaboradorAttributes {
  email_login: string
  rol?: string
  activo: boolean
  persona?: any
  usuario?: any
}

/**
 * Obtiene los datos del colaborador autenticado
 * Requiere un JWT válido en el header Authorization
 */
export async function GET(request: Request) {
  try {
    // Obtener el token del header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No se proporcionó un token de autenticación' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Obtener el usuario autenticado desde Strapi
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    const user = await userResponse.json()

    // Buscar el colaborador vinculado a este usuario
    const colaboradorUrl = `/api/colaboradores?filters[usuario][id][$eq]=${user.id}&populate[persona]=*&populate[usuario]=*`
    
    const response = await strapiClient.get<StrapiResponse<StrapiEntity<ColaboradorAttributes>>>(
      colaboradorUrl
    )

    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      return NextResponse.json(
        { error: 'No se encontró un colaborador vinculado a este usuario' },
        { status: 404 }
      )
    }

    const colaboradorRaw = Array.isArray(response.data) ? response.data[0] : response.data
    
    // Extraer campos del colaborador (pueden venir en attributes si tiene draft/publish)
    const colaboradorAttrs = colaboradorRaw.attributes || colaboradorRaw
    const colaborador = {
      id: colaboradorRaw.id,
      email_login: colaboradorAttrs.email_login || colaboradorRaw.email_login,
      rol: colaboradorAttrs.rol || colaboradorRaw.rol || 'soporte',
      activo: colaboradorAttrs.activo !== undefined ? colaboradorAttrs.activo : colaboradorRaw.activo,
      persona: colaboradorAttrs.persona?.data || colaboradorRaw.persona?.data || colaboradorAttrs.persona || colaboradorRaw.persona || null,
      usuario: colaboradorAttrs.usuario?.data || colaboradorRaw.usuario?.data || colaboradorAttrs.usuario || colaboradorRaw.usuario || null,
    }

    return NextResponse.json({ colaborador }, { status: 200 })
  } catch (error: any) {
    console.error('[API /colaboradores/me] Error:', {
      message: error.message,
      status: error.status,
      details: error.details,
    })
    return NextResponse.json(
      {
        error: error.message || 'Error al obtener datos del colaborador',
        details: error.details || {},
        status: error.status || 500,
      },
      { status: error.status || 500 }
    )
  }
}


