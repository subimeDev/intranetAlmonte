/**
 * Sincroniza datos del localStorage a cookies para migración transparente
 * Esto permite que los datos de autenticación almacenados en localStorage
 * se migren automáticamente a cookies para compatibilidad con SSR
 */
export function syncLocalStorageToCookies() {
  // Solo ejecutar en el cliente
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Lista de claves del localStorage que queremos sincronizar a cookies
    const keysToSync = [
      'auth_token',
      'authToken',
      'token',
      'user',
      'userData',
      'colaborador',
      'colaboradorData',
    ]

    keysToSync.forEach((key) => {
      const value = localStorage.getItem(key)
      if (value) {
        // Crear cookie con el mismo valor
        // Expira en 7 días por defecto
        const expires = new Date()
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
      }
    })
  } catch (error) {
    // Silenciar errores de localStorage/cookies (puede fallar en modo incógnito)
    console.warn('[auth] Error al sincronizar localStorage a cookies:', error)
  }
}
