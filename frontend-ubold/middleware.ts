import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware para proteger todas las rutas de la intranet
 * Verifica que el usuario esté autenticado antes de permitir acceso
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/auth-1/sign-in',
    '/auth-1/sign-up',
    '/auth-1/reset-password',
    '/auth-1/new-password',
    '/auth-1/two-factor',
    '/auth-1/login-pin',
    '/auth-1/lock-screen',
    '/auth-1/delete-account',
    '/auth-1/success-mail',
    '/auth-2/sign-in',
    '/auth-2/sign-up',
    '/auth-2/reset-password',
    '/auth-2/new-password',
    '/auth-2/two-factor',
    '/auth-2/login-pin',
    '/auth-2/lock-screen',
    '/auth-2/delete-account',
    '/auth-2/success-mail',
    '/landing',
    '/coming-soon',
    '/maintenance',
    '/error/400',
    '/error/401',
    '/error/403',
    '/error/404',
    '/error/408',
    '/error/500',
  ]

  // Rutas de API públicas (no requieren autenticación)
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/health',
  ]

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

  // Si es una ruta pública o API pública, permitir acceso
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }

  // Verificar autenticación mediante cookies
  const authToken = request.cookies.get('auth_token')?.value
  const colaboradorData = request.cookies.get('colaboradorData')?.value

  // Si no hay token ni datos de colaborador
  if (!authToken || !colaboradorData) {
    // Si es una ruta de API, retornar 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para acceder a este recurso.' },
        { status: 401 }
      )
    }

    // Si es una ruta de página, redirigir a login
    const loginUrl = new URL('/auth-1/sign-in', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si hay token y datos, permitir acceso
  return NextResponse.next()
}

/**
 * Configuración del matcher para aplicar el middleware solo a rutas específicas
 * Excluye archivos estáticos, imágenes, y rutas de API públicas
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes that are public (health, auth/login)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}

