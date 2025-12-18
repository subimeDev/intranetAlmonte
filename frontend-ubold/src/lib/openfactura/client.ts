/**
 * Cliente para la API de OpenFactura.cl
 * Documentación: https://www.openfactura.cl/factura-electronica/api/
 */

const OPENFACTURA_API_URL = process.env.OPENFACTURA_API_URL || 'https://api.openfactura.cl'
const OPENFACTURA_API_KEY = process.env.OPENFACTURA_API_KEY || ''

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
    this.apiKey = OPENFACTURA_API_KEY
    this.baseUrl = OPENFACTURA_API_URL

    if (!this.apiKey) {
      console.warn('[OpenFactura] API Key no configurada. Las facturas electrónicas no se emitirán.')
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('OpenFactura API Key no configurada')
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
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-Key': this.apiKey, // Algunas APIs usan este header
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
      console.error('[OpenFactura] Error en request:', {
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
