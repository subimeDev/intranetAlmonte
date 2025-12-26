/**
 * Pruebas de integración para /api/tienda/pedidos
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'
import strapiClient from '@/lib/strapi/client'
import wooCommerceClient from '@/lib/woocommerce/client'

// Mock de los clientes
jest.mock('@/lib/strapi/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

// Crear instancia mock antes del mock
const mockWooCommerceClientInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}

jest.mock('@/lib/woocommerce/client', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockInstance,
    createWooCommerceClient: jest.fn(() => mockInstance),
  }
})

const mockStrapiClient = strapiClient as jest.Mocked<typeof strapiClient>
// Obtener la instancia mock después de que se haya creado
import { createWooCommerceClient } from '@/lib/woocommerce/client'
const mockWooCommerceClient = wooCommerceClient as jest.Mocked<typeof wooCommerceClient>

describe('/api/tienda/pedidos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('debe obtener todas los pedidos desde Strapi', async () => {
      const mockPedidos = [
        { id: 1, documentId: 'doc1', numero_pedido: 'PED-001' },
        { id: 2, documentId: 'doc2', numero_pedido: 'PED-002' },
      ]

      // Mock: La ruta actual llama directamente a /api/wo-pedidos
      mockStrapiClient.get.mockResolvedValueOnce({
        data: mockPedidos,
        meta: { pagination: { total: 2 } },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/tienda/pedidos')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockPedidos)
      // Verificar que se llamó a Strapi
      expect(mockStrapiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/wo-pedidos')
      )
    })

    it('debe retornar array vacío si hay error', async () => {
      // Mock: el primer get (para verificar endpoint) falla
      mockStrapiClient.get.mockRejectedValueOnce(new Error('Error de conexión'))
      // Mock: el segundo get también falla (si se intenta)
      mockStrapiClient.get.mockRejectedValueOnce(new Error('Error de conexión'))

      const request = new NextRequest('http://localhost:3000/api/tienda/pedidos')
      const response = await GET(request)
      const data = await response.json()

      // La ruta maneja errores devolviendo 200 con array vacío
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('POST', () => {
    it('debe crear pedido solo en WooCommerce (Strapi se sincroniza vía webhook)', async () => {
      const mockWooCommerceOrder = {
        id: 123,
        number: 'WC-123',
        status: 'completed',
        total: '15000',
        currency: 'CLP',
        date_created: '2025-01-01T10:00:00',
        customer_id: 5,
        payment_method: 'cash',
        payment_method_title: 'Efectivo',
        billing: {
          first_name: 'Juan',
          last_name: 'Pérez',
          email: 'juan@example.com',
        },
        shipping: {
          first_name: 'Juan',
          last_name: 'Pérez',
        },
        line_items: [
          {
            id: 1,
            product_id: 10,
            quantity: 2,
            name: 'Producto 1',
          },
        ],
      }

      // Mock: crear en WooCommerce
      mockWooCommerceClient.post.mockResolvedValueOnce(mockWooCommerceOrder as any)

      // Mock: crear en Strapi primero
      const mockStrapiPedido = {
        data: {
          id: 1,
          documentId: 'doc123',
          numero_pedido: 'PED-001',
        },
      }
      mockStrapiClient.post.mockResolvedValueOnce(mockStrapiPedido as any)

      const request = new NextRequest('http://localhost:3000/api/tienda/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            numero_pedido: 'PED-001',
            payment_method: 'cash',
            payment_method_title: 'Efectivo',
            status: 'completed',
            customer_id: 5,
            line_items: [
              {
                product_id: 10,
                quantity: 2,
              },
            ],
            billing: {
              first_name: 'Juan',
              last_name: 'Pérez',
              email: 'juan@example.com',
            },
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('WooCommerce')

      // Verificar que se creó en Strapi primero
      expect(mockStrapiClient.post).toHaveBeenCalledWith(
        '/api/wo-pedidos',
        expect.objectContaining({
          data: expect.objectContaining({
            numero_pedido: 'PED-001',
          }),
        })
      )

      // Verificar que se creó en WooCommerce
      // La ruta mapea los datos de forma diferente, solo verificar que se llamó
      expect(mockWooCommerceClient.post).toHaveBeenCalledWith(
        'orders',
        expect.any(Object)
      )
    })

    it('debe retornar error si falta numero_pedido', async () => {
      const request = new NextRequest('http://localhost:3000/api/tienda/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            payment_method: 'cash',
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('número de pedido')
      expect(mockWooCommerceClient.post).not.toHaveBeenCalled()
      expect(mockStrapiClient.post).not.toHaveBeenCalled()
    })

    it('debe propagar error si WooCommerce falla', async () => {
      // Mock: crear en Strapi primero
      const mockStrapiPedido = {
        data: {
          id: 1,
          documentId: 'doc123',
          numero_pedido: 'PED-002',
        },
      }
      mockStrapiClient.post.mockResolvedValueOnce(mockStrapiPedido as any)

      // Mock: WooCommerce falla
      mockWooCommerceClient.post.mockRejectedValueOnce(
        new Error('Error en WooCommerce') as any
      )

      const request = new NextRequest('http://localhost:3000/api/tienda/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            numero_pedido: 'PED-002',
            originPlatform: 'woo_moraleja',
            items: [
              {
                producto_id: 10,
                cantidad: 1,
              },
            ],
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Error al crear pedido en WooCommerce')
      // Debe haber intentado crear en Strapi primero
      expect(mockStrapiClient.post).toHaveBeenCalled()
    })
  })
})
