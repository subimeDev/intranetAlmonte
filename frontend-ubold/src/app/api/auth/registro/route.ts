import { NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import { getStrapiUrl } from '@/lib/strapi/config'

export const dynamic = 'force-dynamic'

interface RegistroRequest {
  email: string
  password: string
  cliente_id: number
}

/**
 * Endpoint para registrar un nuevo usuario cliente
 * 
 * Flujo:
 * 1. Verificar que el cliente existe en WO-Clientes
 * 2. Verificar que el email del cliente coincide
 * 3. Crear usuario en Strapi (users-permissions)
 * 4. Vincular usuario con WO-Cliente en Intranet-Usuarios-Cliente
 */
export async function POST(request: Request) {
  try {
    const body: RegistroRequest = await request.json()
    const { email, password, cliente_id } = body

    // Validar datos
    if (!email || !password || !cliente_id) {
      return NextResponse.json(
        { error: 'Email, contraseña y cliente_id son requeridos' },
        { status: 400 }
      )
    }

    // 1. Verificar que el cliente existe y el email coincide
    const clienteResponse = await strapiClient.get<any>(
      `/api/wo-clientes/${cliente_id}`
    )

    const cliente = Array.isArray(clienteResponse.data)
      ? clienteResponse.data[0]
      : clienteResponse.data

    if (!cliente || cliente.correo_electronico !== email) {
      return NextResponse.json(
        { error: 'El email no coincide con el cliente especificado' },
        { status: 400 }
      )
    }

    // 2. Verificar si ya existe un usuario con este email
    const strapiUrl = getStrapiUrl('/api/users')
    const existingUsersResponse = await fetch(
      `${strapiUrl}?filters[email][$eq]=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (existingUsersResponse.ok) {
      const existingUsers = await existingUsersResponse.json()
      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
    }

    // 3. Crear usuario en Strapi (users-permissions)
    const strapiAuthUrl = getStrapiUrl('/api/auth/local/register')
    const registerResponse = await fetch(strapiAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        username: email, // Usar email como username
      }),
    })

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json()
      console.error('[API /auth/registro] Error al crear usuario:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'Error al crear usuario' },
        { status: registerResponse.status }
      )
    }

    const usuarioData = await registerResponse.json()
    const usuarioId = usuarioData.user?.id

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Error: usuario creado pero sin ID' },
        { status: 500 }
      )
    }

    // 4. Vincular usuario con WO-Cliente
    const vinculacionResponse = await strapiClient.post<any>(
      '/api/intranet-usuarios-clientes',
      {
        data: {
          usuario: usuarioId,
          cliente: cliente_id,
          fecha_registro: new Date().toISOString(),
          activo: true,
        },
      }
    )

    return NextResponse.json(
      {
        message: 'Usuario registrado correctamente',
        usuario: {
          id: usuarioId,
          email: usuarioData.user?.email,
        },
        jwt: usuarioData.jwt,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API /auth/registro] Error:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      {
        error: error.message || 'Error al registrar usuario',
        details: error.details || {},
      },
      { status: error.status || 500 }
    )
  }
}

