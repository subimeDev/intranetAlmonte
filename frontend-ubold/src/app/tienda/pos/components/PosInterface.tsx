'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardBody, Button, Form, InputGroup, Alert, Badge, Spinner } from 'react-bootstrap'
import { LuSearch, LuPlus, LuMinus, LuTrash2, LuShoppingCart, LuCheck } from 'react-icons/lu'
import Image from 'next/image'
import type { WooCommerceProduct, CartItem } from '@/lib/woocommerce/types'

interface PosInterfaceProps {}

export default function PosInterface({}: PosInterfaceProps) {
  const [products, setProducts] = useState<WooCommerceProduct[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingOrder, setProcessingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  // Cargar productos
  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        per_page: '50',
        stock_status: 'instock',
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/woocommerce/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
      } else {
        setError(data.error || 'Error al cargar productos')
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con WooCommerce')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Agregar producto al carrito
  const addToCart = (product: WooCommerceProduct) => {
    const existingItem = cart.find((item) => item.product.id === product.id)

    if (existingItem) {
      // Incrementar cantidad
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: parseFloat(product.price) * (item.quantity + 1),
                total: parseFloat(product.price) * (item.quantity + 1),
              }
            : item
        )
      )
    } else {
      // Agregar nuevo item
      const price = parseFloat(product.price) || 0
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          subtotal: price,
          total: price,
        },
      ])
    }
  }

  // Actualizar cantidad en carrito
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          const price = parseFloat(item.product.price) || 0
          return {
            ...item,
            quantity,
            subtotal: price * quantity,
            total: price * quantity,
          }
        }
        return item
      })
    )
  }

  // Remover producto del carrito
  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal // Puedes agregar impuestos aquí si es necesario

  // Procesar pedido
  const processOrder = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío')
      return
    }

    setProcessingOrder(true)
    setError(null)
    setOrderSuccess(false)

    try {
      const orderData = {
        payment_method: 'pos',
        payment_method_title: 'Punto de Venta',
        set_paid: true,
        status: 'completed',
        line_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      }

      const response = await fetch('/api/woocommerce/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        setOrderSuccess(true)
        setCart([]) // Limpiar carrito
        setTimeout(() => {
          setOrderSuccess(false)
        }, 5000)
      } else {
        setError(data.error || 'Error al procesar el pedido')
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con WooCommerce')
    } finally {
      setProcessingOrder(false)
    }
  }

  // Limpiar carrito
  const clearCart = () => {
    setCart([])
  }

  return (
    <div className="pos-interface">
      <div className="row g-3">
        {/* Panel de Productos */}
        <div className="col-lg-8">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Productos</h5>
                <Badge bg="primary">{products.length} productos</Badge>
              </div>

              {/* Búsqueda */}
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <LuSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Mensajes */}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {orderSuccess && (
                <Alert variant="success">
                  <LuCheck className="me-2" />
                  Pedido procesado exitosamente
                </Alert>
              )}

              {/* Lista de Productos */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Cargando productos...</p>
                </div>
              ) : products.length === 0 ? (
                <Alert variant="info">No se encontraron productos</Alert>
              ) : (
                <div className="row g-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {products.map((product) => {
                    const price = parseFloat(product.price) || 0
                    const inStock = product.stock_status === 'instock'
                    const stockQuantity = product.stock_quantity

                    return (
                      <div key={product.id} className="col-md-4 col-sm-6">
                        <Card
                          className={`h-100 ${inStock ? 'border-primary' : 'border-secondary opacity-50'}`}
                          style={{ cursor: inStock ? 'pointer' : 'not-allowed' }}
                          onClick={() => inStock && addToCart(product)}
                        >
                          <div className="position-relative" style={{ height: '150px', overflow: 'hidden' }}>
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0].src}
                                alt={product.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                            ) : (
                              <div
                                className="w-100 h-100 d-flex align-items-center justify-content-center bg-light"
                                style={{ fontSize: '3rem' }}
                              >
                                📦
                              </div>
                            )}
                            {!inStock && (
                              <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center">
                                <Badge bg="danger">Sin Stock</Badge>
                              </div>
                            )}
                          </div>
                          <CardBody className="p-2">
                            <h6 className="mb-1 text-truncate" style={{ fontSize: '0.9rem' }}>
                              {product.name}
                            </h6>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold text-primary">
                                ${price.toLocaleString('es-CL')}
                              </span>
                              {stockQuantity !== null && (
                                <small className="text-muted">Stock: {stockQuantity}</small>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Panel del Carrito */}
        <div className="col-lg-4">
          <Card className="sticky-top" style={{ top: '20px' }}>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <LuShoppingCart className="me-2" />
                  Carrito
                </h5>
                {cart.length > 0 && (
                  <Button variant="outline-danger" size="sm" onClick={clearCart}>
                    <LuTrash2 /> Limpiar
                  </Button>
                )}
              </div>

              {cart.length === 0 ? (
                <Alert variant="secondary" className="mb-0">
                  El carrito está vacío
                </Alert>
              ) : (
                <>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {cart.map((item) => {
                      const price = parseFloat(item.product.price) || 0
                      return (
                        <div key={item.product.id} className="border-bottom pb-2 mb-2">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1" style={{ fontSize: '0.9rem' }}>
                                {item.product.name}
                              </h6>
                              <div className="d-flex align-items-center gap-2">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                >
                                  <LuMinus />
                                </Button>
                                <span className="fw-bold">{item.quantity}</span>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                >
                                  <LuPlus />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="ms-auto"
                                >
                                  <LuTrash2 />
                                </Button>
                              </div>
                            </div>
                            <div className="text-end ms-2">
                              <div className="fw-bold">${item.total.toLocaleString('es-CL')}</div>
                              <small className="text-muted">${price.toLocaleString('es-CL')} c/u</small>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-top pt-3 mt-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span className="fw-bold">${subtotal.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="fs-5 fw-bold">Total:</span>
                      <span className="fs-5 fw-bold text-primary">
                        ${total.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100"
                      onClick={processOrder}
                      disabled={processingOrder || cart.length === 0}
                    >
                      {processingOrder ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <LuCheck className="me-2" />
                          Procesar Pedido
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

