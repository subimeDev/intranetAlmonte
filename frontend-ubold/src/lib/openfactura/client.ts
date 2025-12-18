/**
 * Cliente para la API de Haulmer (Espacio)
 * Documentación: https://espacio.haulmer.com/
 */

const HAULMER_API_URL = process.env.HAULMER_API_URL || 'https://espacio.haulmer.com'
const HAULMER_API_KEY = process.env.HAULMER_API_KEY || process.env.OPENFACTURA_API_KEY || ''

interface OpenFacturaResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface OpenFacturaClient {
  post<T = any>(endpoint: string, data: any): Promise<T>
  get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T>
}

class OpenFacturaClientImpl implements OpenFacturaClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = HAULMER_API_KEY
    this.baseUrl = HAULMER_API_URL

    if (!this.apiKey) {
      console.warn('[Haulmer] API Key no configurada. Las facturas electrónicas no se emitirán.')
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Haulmer API Key no configurada')
    }

    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Agregar parámetros de query si existen
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey, // Haulmer usa X-API-Key para autenticación
      'Accept': 'application/json',
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url.toString(), config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || 
          errorData.error || 
          `Error ${response.status}: ${response.statusText}`
        )
      }

      const result = await response.json()
      return result as T
    } catch (error: any) {
      console.error('[Haulmer] Error en request:', {
        method,
        endpoint,
        error: error.message,
      })
      throw error
    }
  }

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('POST', endpoint, data)
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, params)
  }
}

// Exportar instancia singleton
const openFacturaClient = new OpenFacturaClientImpl()

export default openFacturaClient
