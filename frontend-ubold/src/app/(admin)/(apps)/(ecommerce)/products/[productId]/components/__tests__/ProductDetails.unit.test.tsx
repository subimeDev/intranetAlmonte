/**
 * @jest-environment jsdom
 */

/**
 * Pruebas unitarias para el componente ProductDetails
 */

import '@testing-library/jest-dom'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductDetails } from '../ProductDetails'

// Mock de fetch
global.fetch = jest.fn()

// Mock de los componentes hijos
jest.mock('@/app/(admin)/(apps)/(ecommerce)/add-product/components/RelationSelector', () => ({
  RelationSelector: ({ label, value, onChange, endpoint }: any) => (
    <div data-testid={`relation-selector-${label.toLowerCase()}`}>
      <label>{label}</label>
      <select
        value={Array.isArray(value) ? value[0] : value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`select-${label.toLowerCase()}`}
      >
        <option value="">Seleccionar...</option>
        <option value="1">Opción 1</option>
        <option value="2">Opción 2</option>
      </select>
    </div>
  ),
}))

jest.mock('@/app/(admin)/(apps)/(ecommerce)/add-product/components/ProductImage', () => ({
  __esModule: true,
  default: ({ onImageChange }: any) => (
    <div data-testid="product-image">
      <input
        type="file"
        data-testid="image-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImageChange(file)
        }}
      />
    </div>
  ),
}))

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('ProductDetails', () => {
  const mockProducto = {
    id: '123',
    documentId: '123',
    attributes: {
      nombre_libro: 'Libro de Prueba',
      isbn_libro: '978-1234567890',
      subtitulo_libro: 'Subtítulo de Prueba',
      descripcion: 'Descripción del libro',
      precio: '19990',
      precio_oferta: '14990',
      stock_quantity: '10',
      manage_stock: true,
      stock_status: 'instock',
      backorders: 'no',
      type: 'simple',
      weight: '0.5',
      length: '20',
      width: '15',
      height: '2',
      virtual: false,
      downloadable: false,
      featured: false,
      sold_individually: false,
      reviews_allowed: true,
      catalog_visibility: 'visible',
      numero_edicion: '1',
      agno_edicion: '2024',
      idioma: 'Español',
      tipo_libro: 'Plan Lector',
      estado_edicion: 'Vigente',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Renderizado básico', () => {
    it('debe renderizar el componente en modo vista', () => {
      render(<ProductDetails producto={mockProducto} />)

      expect(screen.getByText('Detalles del Producto')).toBeInTheDocument()
      expect(screen.getByText('Editar Producto')).toBeInTheDocument()
    })

    it('debe mostrar los datos del producto en modo vista', () => {
      render(<ProductDetails producto={mockProducto} />)

      expect(screen.getByText('Libro de Prueba')).toBeInTheDocument()
      expect(screen.getByText('978-1234567890')).toBeInTheDocument()
      expect(screen.getByText('Subtítulo de Prueba')).toBeInTheDocument()
    })

    it('debe mostrar "N/A" para campos vacíos', () => {
      const productoVacio = {
        id: '123',
        attributes: {},
      }

      render(<ProductDetails producto={productoVacio} />)

      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
    })
  })

  describe('Modo edición', () => {
    it('debe cambiar a modo edición al hacer clic en "Editar Producto"', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      expect(screen.getByText('Guardar Cambios')).toBeInTheDocument()
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    it('debe mostrar todos los campos editables en modo edición', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      expect(screen.getByPlaceholderText(/Ejemplo: 978-3-16-148410-0/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Título del libro')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Subtítulo del libro (opcional)')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Descripción del libro')).toBeInTheDocument()
      // Hay múltiples inputs con placeholder "0.00"
      expect(screen.getAllByPlaceholderText('0.00').length).toBeGreaterThan(0)
    })

    it('debe volver a modo vista al hacer clic en "Cancelar"', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)

      expect(screen.getByText('Editar Producto')).toBeInTheDocument()
      expect(screen.queryByText('Guardar Cambios')).not.toBeInTheDocument()
    })
  })

  describe('Manejo de formulario', () => {
    it('debe actualizar el valor del campo al escribir', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const nombreInput = screen.getByPlaceholderText('Título del libro')
      await user.clear(nombreInput)
      await user.type(nombreInput, 'Nuevo Nombre')

      expect(nombreInput).toHaveValue('Nuevo Nombre')
    })

    it('debe permitir editar múltiples campos', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const nombreInput = screen.getByPlaceholderText('Título del libro')
      // Hay múltiples inputs con placeholder "0.00", usar getAllByPlaceholderText y tomar el primero (precio regular)
      const precioInputs = screen.getAllByPlaceholderText('0.00')
      const precioInput = precioInputs[0] // Precio regular

      await user.clear(nombreInput)
      await user.type(nombreInput, 'Libro Actualizado')

      await user.clear(precioInput)
      await user.type(precioInput, '25000')

      expect(nombreInput).toHaveValue('Libro Actualizado')
      expect(precioInput).toHaveValue(25000)
    })
  })

  describe('Validación', () => {
    it('debe mostrar error si se intenta guardar sin nombre del libro', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const nombreInput = screen.getByPlaceholderText('Título del libro')
      await user.clear(nombreInput)

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/El nombre del libro es obligatorio/i)).toBeInTheDocument()
      })
    })

    it('debe validar que el producto tenga un ID válido', async () => {
      const user = userEvent.setup()
      const productoSinId = {
        id: 'unknown',
        attributes: { nombre_libro: 'Test' },
      }

      render(<ProductDetails producto={productoSinId} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/No se pudo obtener el ID del producto/i)).toBeInTheDocument()
      })
    })
  })

  describe('Guardado de datos', () => {
    it('debe guardar los cambios correctamente', async () => {
      const user = userEvent.setup()
      const onUpdate = jest.fn()
      const onProductoUpdate = jest.fn()

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)

      render(
        <ProductDetails
          producto={mockProducto}
          onUpdate={onUpdate}
          onProductoUpdate={onProductoUpdate}
        />
      )

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const nombreInput = screen.getByPlaceholderText('Título del libro')
      await user.clear(nombreInput)
      await user.type(nombreInput, 'Libro Actualizado')

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/tienda/productos/123'),
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })

      await waitFor(() => {
        expect(onProductoUpdate).toHaveBeenCalled()
      })
    })

    it('debe mostrar mensaje de éxito después de guardar', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/Producto actualizado exitosamente/i)).toBeInTheDocument()
      })
    })

    it('debe manejar errores del servidor', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Error del servidor' }),
      } as Response)

      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Error del servidor')).toBeInTheDocument()
      })
    })

    it('debe subir imagen si se proporciona una nueva', async () => {
      const user = userEvent.setup()

      // Mock para upload
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, id: 456, url: 'http://example.com/image.jpg' }),
        } as Response)
        // Mock para actualizar producto
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)

      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const imageInput = screen.getByTestId('image-input')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await user.upload(imageInput, file)

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/tienda/upload',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })
  })

  describe('Manejo de datos del producto', () => {
    it('debe manejar productos con estructura attributes', () => {
      render(<ProductDetails producto={mockProducto} />)

      expect(screen.getByText('Libro de Prueba')).toBeInTheDocument()
    })

    it('debe manejar productos sin estructura attributes', () => {
      const productoDirecto = {
        id: '123',
        nombre_libro: 'Libro Directo',
        isbn_libro: '978-1111111111',
      }

      render(<ProductDetails producto={productoDirecto} />)

      expect(screen.getByText('Libro Directo')).toBeInTheDocument()
    })

    it('debe extraer descripción de formato blocks de Strapi', () => {
      const productoConBlocks = {
        id: '123',
        attributes: {
          nombre_libro: 'Test',
          descripcion: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'Descripción desde blocks' }],
            },
          ],
        },
      }

      render(<ProductDetails producto={productoConBlocks} />)

      expect(screen.getByText('Descripción desde blocks')).toBeInTheDocument()
    })

    it('debe manejar relaciones con documentId o id', () => {
      const productoConRelaciones = {
        id: '123',
        attributes: {
          nombre_libro: 'Test',
          obra: { documentId: 'obra-1', id: 'obra-1' },
          autor_relacion: { id: 'autor-1' },
        },
      }

      render(<ProductDetails producto={productoConRelaciones} />)

      const editButton = screen.getByText('Editar Producto')
      fireEvent.click(editButton)

      // Verificar que los selectores de relación se renderizan
      expect(screen.getByTestId('relation-selector-obra')).toBeInTheDocument()
      expect(screen.getByTestId('relation-selector-autor')).toBeInTheDocument()
    })
  })

  describe('Campos WooCommerce', () => {
    it('debe mostrar y permitir editar campos de precio', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      expect(screen.getByText(/Precio Regular/i)).toBeInTheDocument()
      expect(screen.getByText(/Precio de Oferta/i)).toBeInTheDocument()
    })

    it('debe mostrar y permitir editar campos de inventario', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      // Hay múltiples elementos con "Stock", usar getAllByText
      expect(screen.getAllByText(/Stock/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/Estado de Stock/i)).toBeInTheDocument()
      expect(screen.getByText(/Backorders/i)).toBeInTheDocument()
    })

    it('debe mostrar y permitir editar campos de peso y dimensiones', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      expect(screen.getByText(/Peso \(kg\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Largo \(cm\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Ancho \(cm\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Alto \(cm\)/i)).toBeInTheDocument()
    })

    it('debe mostrar checkboxes de opciones adicionales', async () => {
      const user = userEvent.setup()
      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      expect(screen.getByText(/Producto Virtual/i)).toBeInTheDocument()
      expect(screen.getByText(/Producto Descargable/i)).toBeInTheDocument()
      expect(screen.getByText(/Producto Destacado/i)).toBeInTheDocument()
      expect(screen.getByText(/Permitir Reseñas/i)).toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('debe llamar onUpdate después de guardar exitosamente', async () => {
      const user = userEvent.setup()
      const onUpdate = jest.fn().mockResolvedValue(undefined)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      render(<ProductDetails producto={mockProducto} onUpdate={onUpdate} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled()
      })
    })

    it('debe llamar onProductoUpdate con los datos actualizados', async () => {
      const user = userEvent.setup()
      const onProductoUpdate = jest.fn()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      render(
        <ProductDetails
          producto={mockProducto}
          onProductoUpdate={onProductoUpdate}
        />
      )

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const nombreInput = screen.getByPlaceholderText('Título del libro')
      await user.clear(nombreInput)
      await user.type(nombreInput, 'Nuevo Nombre')

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      await waitFor(() => {
        expect(onProductoUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            nombre_libro: 'Nuevo Nombre',
          })
        )
      })
    })
  })

  describe('Estados de carga', () => {
    it('debe mostrar spinner mientras guarda', async () => {
      const user = userEvent.setup()

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                } as Response),
              100
            )
          )
      )

      render(<ProductDetails producto={mockProducto} />)

      const editButton = screen.getByText('Editar Producto')
      await user.click(editButton)

      const saveButton = screen.getByText('Guardar Cambios')
      await user.click(saveButton)

      // Verificar que el botón está deshabilitado y muestra el spinner
      await waitFor(() => {
        expect(saveButton).toBeDisabled()
      })
      
      // Verificar que hay un spinner o texto de carga (hay múltiples elementos con "Guardando")
      expect(screen.getAllByText(/Guardando/i).length).toBeGreaterThan(0)
    })
  })
})

