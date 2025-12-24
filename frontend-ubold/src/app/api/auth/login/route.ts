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
 * Usa el endpoint personalizado de Strapi que verifica email_login y password
 * del Colaborador directamente
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

    // Llamar al endpoint personalizado de Strapi para login de colaboradores
    const loginUrl = getStrapiUrl('/api/colaboradores/login')
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_login: email, // Usar email_login del Colaborador
        password, // Usar password del Colaborador
      }),
    })

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}))
      console.error('[API /auth/login] Error al autenticar:', {
        status: loginResponse.status,
        error: errorData,
      })
      return NextResponse.json(
        { 
          error: errorData.error?.message || errorData.message || 'Error al iniciar sesión',
        },
        { status: loginResponse.status }
      )
    }

    const data = await loginResponse.json()

    // Extraer campos del colaborador (pueden venir en attributes si tiene draft/publish)
    const colaboradorRaw = data.colaborador
    let colaborador = colaboradorRaw
    if (colaboradorRaw) {
      const colaboradorRawAny = colaboradorRaw as any
      const colaboradorAttrs = colaboradorRawAny.attributes || colaboradorRawAny
      colaborador = {
        id: colaboradorRawAny.id,
        email_login: colaboradorAttrs.email_login || colaboradorRawAny.email_login,
        rol: colaboradorAttrs.rol || colaboradorRawAny.rol || 'soporte',
        activo: colaboradorAttrs.activo !== undefined ? colaboradorAttrs.activo : colaboradorRawAny.activo,
        persona: colaboradorAttrs.persona?.data || colaboradorRawAny.persona?.data || colaboradorAttrs.persona || colaboradorRawAny.persona || null,
        usuario: colaboradorAttrs.usuario?.data || colaboradorRawAny.usuario?.data || colaboradorAttrs.usuario || colaboradorRawAny.usuario || null,
      }
    }

    return NextResponse.json(
      {
        message: 'Login exitoso',
        jwt: data.jwt,
        usuario: data.usuario,
        colaborador: colaborador,
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

