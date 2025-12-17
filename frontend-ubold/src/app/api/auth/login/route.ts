import { NextResponse } from 'next/server'
import { getStrapiUrl } from '@/lib/strapi/config'

export const dynamic = 'force-dynamic'

interface LoginRequest {
  email: string
  password: string
}

/**
 * Endpoint para login de usuarios colaborador
 * 
 * Usa el endpoint de autenticación de Strapi (users-permissions)
 * y retorna el JWT token junto con los datos del colaborador vinculado
 */
export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validar datos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Autenticar con Strapi (users-permissions)
    const strapiAuthUrl = getStrapiUrl('/api/auth/local')
    const loginResponse = await fetch(strapiAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: email, // Strapi usa 'identifier' que puede ser email o username
        password,
      }),
    })

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}))
      console.error('[API /auth/login] Error al autenticar:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'Credenciales inválidas' },
        { status: loginResponse.status || 401 }
      )
    }

    const authData = await loginResponse.json()
    const usuarioId = authData.user?.id

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Error: usuario autenticado pero sin ID' },
        { status: 500 }
      )
    }

    // Obtener datos del colaborador vinculado
    const strapiUrl = getStrapiUrl(
      `/api/colaboradores?filters[usuario][id][$eq]=${usuarioId}&populate=persona,empresa`
    )

    const colaboradorResponse = await fetch(strapiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    let colaboradorData = null
    if (colaboradorResponse.ok) {
      const colaboradorDataResponse = await colaboradorResponse.json()
      const colaboradores = Array.isArray(colaboradorDataResponse.data)
        ? colaboradorDataResponse.data
        : colaboradorDataResponse.data
          ? [colaboradorDataResponse.data]
          : []

      if (colaboradores.length > 0) {
        colaboradorData = colaboradores[0]

        // Verificar que el colaborador esté activo
        if (!colaboradorData.activo) {
          return NextResponse.json(
            { error: 'Tu cuenta está desactivada. Contacta al administrador.' },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Usuario no está vinculado a un colaborador' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      {
        message: 'Login exitoso',
        jwt: authData.jwt,
        usuario: {
          id: authData.user.id,
          email: authData.user.email,
          username: authData.user.username,
        },
        colaborador: colaboradorData ? {
          id: colaboradorData.id,
          email_login: colaboradorData.email_login,
          rol_principal: colaboradorData.rol_principal,
          rol_operativo: colaboradorData.rol_operativo,
          activo: colaboradorData.activo,
          persona: colaboradorData.persona,
          empresa: colaboradorData.empresa,
        } : null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API /auth/login] Error:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      {
        error: error.message || 'Error al iniciar sesión',
        details: error.details || {},
      },
      { status: error.status || 500 }
    )
  }
}

