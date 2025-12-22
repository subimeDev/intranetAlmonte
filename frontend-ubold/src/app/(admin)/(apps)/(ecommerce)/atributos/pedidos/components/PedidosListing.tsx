'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Row as TableRow,
  Table as TableType,
  useReactTable,
} from '@tanstack/react-table'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { Button, Card, CardFooter, CardHeader, Col, Row, Alert, Badge } from 'react-bootstrap'
import { LuSearch } from 'react-icons/lu'
import { TbEdit, TbEye, TbList, TbPlus, TbTrash } from 'react-icons/tb'

import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

// Tipo para la tabla
type PedidoType = {
  id: number
  numero_pedido: string
  fecha_pedido: string | null
  estado: string
  total: number | null
  subtotal: number | null
  impuestos: number | null
  envio: number | null
  descuento: number | null
  moneda: string
  origen: string
  originPlatform: string
  date: string
  time: string
  url: string
}

// Helper para obtener campo con múltiples variaciones
const getField = (obj: any, ...fieldNames: string[]): any => {
  for (const fieldName of fieldNames) {
    if (obj[fieldName] !== undefined && obj[fieldName] !== null && obj[fieldName] !== '') {
      return obj[fieldName]
    }
  }
  return undefined
}

// Función para mapear pedidos de Strapi al formato PedidoType
const mapStrapiPedidoToPedidoType = (pedido: any): PedidoType => {
  const attrs = pedido.attributes || {}
  const data = (attrs && Object.keys(attrs).length > 0) ? attrs : (pedido as any)

  const numeroPedido = getField(data, 'numero_pedido', 'numeroPedido', 'NUMERO_PEDIDO') || 'Sin número'
  const fechaPedido = getField(data, 'fecha_pedido', 'fechaPedido', 'FECHA_PEDIDO')
  const estado = getField(data, 'estado', 'ESTADO') || 'pendiente'
  const total = getField(data, 'total', 'TOTAL')
  const subtotal = getField(data, 'subtotal', 'SUBTOTAL')
  const impuestos = getField(data, 'impuestos', 'IMPUESTOS')
  const envio = getField(data, 'envio', 'ENVIO')
  const descuento = getField(data, 'descuento', 'DESCUENTO')
  const moneda = getField(data, 'moneda', 'MONEDA') || 'CLP'
  const origen = getField(data, 'origen', 'ORIGEN') || 'woocommerce'
  // originPlatform es un campo directo en Strapi (Enumeration)
  const originPlatform = getField(data, 'originPlatform', 'origin_platform', 'ORIGIN_PLATFORM') || 'woo_moraleja'
  
  // Obtener fechas
  const createdAt = attrs.createdAt || (pedido as any).createdAt || fechaPedido || new Date().toISOString()
  const createdDate = new Date(createdAt)
  
  return {
    id: pedido.id || pedido.documentId || pedido.id,
    numero_pedido: numeroPedido,
    fecha_pedido: fechaPedido || null,
    estado,
    total: total ? parseFloat(total) : null,
    subtotal: subtotal ? parseFloat(subtotal) : null,
    impuestos: impuestos ? parseFloat(impuestos) : null,
    envio: envio ? parseFloat(envio) : null,
    descuento: descuento ? parseFloat(descuento) : null,
    moneda,
    origen,
    originPlatform,
    date: format(createdDate, 'dd MMM, yyyy'),
    time: format(createdDate, 'h:mm a'),
    url: `/atributos/pedidos/${pedido.id || pedido.documentId || pedido.id}`,
  }
}

interface PedidosListingProps {
  pedidos?: any[]
  error?: string | null
}

const columnHelper = createColumnHelper<PedidoType>()

const PedidosListing = ({ pedidos, error }: PedidosListingProps = {}) => {
  const router = useRouter()
  
  const mappedPedidos = useMemo(() => {
    if (pedidos && pedidos.length > 0) {
      console.log('[PedidosListing] Pedidos recibidos:', pedidos.length)
      const mapped = pedidos.map(mapStrapiPedidoToPedidoType)
      console.log('[PedidosListing] Pedidos mapeados:', mapped.length)
      return mapped
    }
    console.log('[PedidosListing] No hay pedidos de Strapi')
    return []
  }, [pedidos])

  const columns: ColumnDef<PedidoType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<PedidoType> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: TableRow<PedidoType> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('numero_pedido', {
      header: 'Número de Pedido',
      cell: ({ row }) => {
        return (
          <div className="d-flex">
            <div className="avatar-md me-3 bg-light d-flex align-items-center justify-center rounded">
              <span className="text-muted fs-xs">📦</span>
            </div>
            <div>
              <h5 className="mb-0">
                <Link href={`/atributos/pedidos/${row.original.id}`} className="link-reset">
                  {row.original.numero_pedido || 'Sin número'}
                </Link>
              </h5>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('fecha_pedido', {
      header: 'Fecha',
      cell: ({ row }) => {
        if (!row.original.fecha_pedido) return <span className="text-muted">-</span>
        const fecha = new Date(row.original.fecha_pedido)
        return <span className="text-muted">{format(fecha, 'dd MMM, yyyy')}</span>
      },
    }),
    columnHelper.accessor('estado', {
      header: 'Estado',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const estado = row.original.estado
        let variant: string
        let label: string
        switch (estado) {
          case 'pendiente':
            variant = 'warning'
            label = 'Pendiente'
            break
          case 'procesando':
            variant = 'info'
            label = 'Procesando'
            break
          case 'en_espera':
            variant = 'secondary'
            label = 'En Espera'
            break
          case 'completado':
            variant = 'success'
            label = 'Completado'
            break
          case 'cancelado':
            variant = 'danger'
            label = 'Cancelado'
            break
          case 'reembolsado':
            variant = 'dark'
            label = 'Reembolsado'
            break
          case 'fallido':
            variant = 'danger'
            label = 'Fallido'
            break
          default:
            variant = 'secondary'
            label = estado
            break
        }
        return <Badge bg={variant}>{label}</Badge>
      },
    }),
    columnHelper.accessor('total', {
      header: 'Total',
      cell: ({ row }) => {
        const total = row.original.total
        const moneda = row.original.moneda || 'CLP'
        if (!total) return <span className="text-muted">-</span>
        return <span className="fw-semibold">${total.toLocaleString()} {moneda}</span>
      },
    }),
    columnHelper.accessor('originPlatform', {
      header: 'Plataforma',
      cell: ({ row }) => {
        const platform = row.original.originPlatform
        let variant: string
        switch (platform) {
          case 'woo_moraleja':
            variant = 'info'
            break
          case 'woo_escolar':
            variant = 'primary'
            break
          case 'otros':
          default:
            variant = 'secondary'
            break
        }
        return <Badge bg={variant}>{platform.replace('woo_', 'WooCommerce ').replace('_', ' ').toUpperCase()}</Badge>
      },
    }),
    columnHelper.accessor('date', {
      header: 'Creado',
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-muted">{row.original.time}</small>
        </>
      ),
    }),
    {
      header: 'Acciones',
      cell: ({ row }: { row: TableRow<PedidoType> }) => (
        <div className="d-flex gap-1">
          <Link href={`/atributos/pedidos/${row.original.id}`}>
            <Button variant="default" size="sm" className="btn-icon rounded-circle">
              <TbEye className="fs-lg" />
            </Button>
          </Link>
          <Link href={`/atributos/pedidos/${row.original.id}`}>
            <Button
              variant="default"
              size="sm"
              className="btn-icon rounded-circle"
            >
              <TbEdit className="fs-lg" />
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            className="btn-icon rounded-circle"
            onClick={() => {
              toggleDeleteModal()
              setSelectedRowIds({ [row.id]: true })
            }}>
            <TbTrash className="fs-lg" />
          </Button>
        </div>
      ),
    },
  ]

  const [data, setData] = useState<PedidoType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 })

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pedidos-column-order')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error al cargar orden de columnas:', e)
        }
      }
    }
    return []
  })

  const handleColumnOrderChange = (newOrder: string[]) => {
    setColumnOrder(newOrder)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pedidos-column-order', JSON.stringify(newOrder))
    }
  }

  useEffect(() => {
    console.log('[PedidosListing] useEffect - pedidos:', pedidos?.length, 'mappedPedidos:', mappedPedidos.length)
    setData(mappedPedidos)
    console.log('[PedidosListing] Datos actualizados. Total:', mappedPedidos.length)
  }, [mappedPedidos, pedidos])

  const table = useReactTable<PedidoType>({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination, rowSelection: selectedRowIds, columnOrder },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    enableColumnFilters: true,
    enableRowSelection: true,
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalItems = table.getFilteredRowModel().rows.length

  const start = pageIndex * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalItems)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  const toggleDeleteModal = () => {
    setShowDeleteModal(!showDeleteModal)
  }

  const handleDelete = async () => {
    const selectedRowIdsArray = Object.keys(selectedRowIds)
    const idsToDelete = selectedRowIdsArray
      .map(rowId => {
        const row = table.getRow(rowId)
        return row?.original?.id
      })
      .filter(Boolean)
    
    if (idsToDelete.length === 0) {
      alert('No se seleccionaron pedidos para eliminar')
      return
    }
    
    try {
      for (const pedidoId of idsToDelete) {
        const response = await fetch(`/api/tienda/pedidos/${pedidoId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Error al eliminar pedido ${pedidoId}`)
        }
      }
      
      // Actualizar datos eliminando los pedidos eliminados
      setData((old) => old.filter(pedido => !idsToDelete.includes(pedido.id)))
      setSelectedRowIds({})
      setPagination({ ...pagination, pageIndex: 0 })
      setShowDeleteModal(false)
      
      // Recargar la página para obtener datos actualizados
      router.refresh()
    } catch (error: any) {
      console.error('Error al eliminar pedidos:', error)
      alert(`Error al eliminar los pedidos seleccionados: ${error.message || 'Error desconocido'}`)
    }
  }

  const hasError = !!error
  const hasData = mappedPedidos.length > 0
  
  if (hasError && !hasData) {
    return (
      <Row>
        <Col xs={12}>
          <Alert variant="warning">
            <strong>Error al cargar pedidos desde Strapi:</strong> {error}
          </Alert>
        </Col>
      </Row>
    )
  }
  
  if (hasError && hasData) {
    console.warn('[PedidosListing] Error al cargar desde Strapi, usando datos disponibles:', error)
  }

  return (
    <Row>
      <Col xs={12}>
        <Card className="mb-4">
          <CardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2">
              <div className="app-search">
                <input
                  type="search"
                  className="form-control"
                  placeholder="Buscar número de pedido..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <LuSearch className="app-search-icon text-muted" />
              </div>

              {Object.keys(selectedRowIds).length > 0 && (
                <Button variant="danger" size="sm" onClick={toggleDeleteModal}>
                  Eliminar
                </Button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="me-2 fw-semibold">Filtrar por:</span>

              <div className="app-search">
                <select
                  className="form-select form-control my-1 my-md-0"
                  value={(table.getColumn('estado')?.getFilterValue() as string) ?? 'All'}
                  onChange={(e) => table.getColumn('estado')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Estado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="procesando">Procesando</option>
                  <option value="en_espera">En Espera</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="reembolsado">Reembolsado</option>
                  <option value="fallido">Fallido</option>
                </select>
              </div>

              <div>
                <select
                  className="form-select form-control my-1 my-md-0"
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}>
                  {[5, 8, 10, 15, 20].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex gap-1">
              <Button variant="primary" className="btn-icon">
                <TbList className="fs-lg" />
              </Button>
              <Link href="/atributos/pedidos/agregar" passHref>
                <Button variant="danger" className="ms-1">
                  <TbPlus className="fs-sm me-2" /> Agregar Pedido
                </Button>
              </Link>
            </div>
          </CardHeader>

          <DataTable<PedidoType>
            table={table}
            emptyMessage="No se encontraron pedidos"
            enableColumnReordering={true}
            onColumnOrderChange={handleColumnOrderChange}
          />

          {table.getRowModel().rows.length > 0 && (
            <CardFooter className="border-0">
              <TablePagination
                totalItems={totalItems}
                start={start}
                end={end}
                itemsName="pedidos"
                showInfo
                previousPage={table.previousPage}
                canPreviousPage={table.getCanPreviousPage()}
                pageCount={table.getPageCount()}
                pageIndex={table.getState().pagination.pageIndex}
                setPageIndex={table.setPageIndex}
                nextPage={table.nextPage}
                canNextPage={table.getCanNextPage()}
              />
            </CardFooter>
          )}

          <DeleteConfirmationModal
            show={showDeleteModal}
            onHide={toggleDeleteModal}
            onConfirm={handleDelete}
            selectedCount={Object.keys(selectedRowIds).length}
            itemName="pedido"
          />
        </Card>
      </Col>
    </Row>
  )
}

export default PedidosListing

