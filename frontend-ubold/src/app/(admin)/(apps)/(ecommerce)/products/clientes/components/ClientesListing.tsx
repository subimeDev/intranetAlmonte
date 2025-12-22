'use client'
import {
  ColumnDef,
  ColumnFiltersState,
  createColumnHelper,
  FilterFn,
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
import { Button, Card, CardFooter, CardHeader, Col, Row, Alert } from 'react-bootstrap'
import { LuMail, LuSearch, LuUser, LuDollarSign, LuShoppingCart } from 'react-icons/lu'
import { TbEdit, TbEye, TbList, TbTrash } from 'react-icons/tb'

import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import { currency } from '@/helpers'
import { toPascalCase } from '@/helpers/casing'
import { format } from 'date-fns'

// Tipo para cliente mapeado
type ClienteType = {
  id: number
  nombre: string
  correo: string
  telefono?: string
  direccion?: string
  pedidos: number
  gastoTotal: number
  fechaRegistro: string
  ultimaActividad?: string
  status: 'active' | 'inactive'
  url: string
  strapiId?: number
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

// Función para mapear clientes de Strapi al formato ClienteType
const mapStrapiClienteToClienteType = (cliente: any): ClienteType => {
  // Los datos pueden venir en attributes o directamente
  const attrs = cliente.attributes || {}
  const data = (attrs && Object.keys(attrs).length > 0) ? attrs : (cliente as any)

  // Obtener nombre con múltiples variaciones
  const nombre = getField(data, 'nombre', 'NOMBRE', 'name', 'NAME') || 'Sin nombre'
  const correo = getField(data, 'correo_electronico', 'correoElectronico', 'email', 'EMAIL', 'correo') || 'Sin correo'
  const telefono = getField(data, 'telefono', 'TELEFONO', 'phone', 'PHONE') || ''
  const direccion = getField(data, 'direccion', 'DIRECCION', 'address', 'ADDRESS') || ''
  const pedidos = typeof data.pedidos === 'number' ? data.pedidos : (typeof data.PEDIDOS === 'number' ? data.PEDIDOS : 0)
  const gastoTotal = typeof data.gasto_total === 'number' ? data.gasto_total : (typeof data.GASTO_TOTAL === 'number' ? data.GASTO_TOTAL : 0)
  
  const fechaRegistro = data.fecha_registro || data.FECHA_REGISTRO || attrs.createdAt || cliente.createdAt || new Date().toISOString()
  const ultimaActividad = data.ultima_actividad || data.ULTIMA_ACTIVIDAD || attrs.updatedAt || cliente.updatedAt
  
  const createdDate = new Date(fechaRegistro)
  const lastActivityDate = ultimaActividad ? new Date(ultimaActividad) : createdDate
  
  // Determinar status basado en última actividad (si tiene actividad reciente es activo)
  const daysSinceLastActivity = (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  const status: 'active' | 'inactive' = daysSinceLastActivity < 90 ? 'active' : 'inactive'

  return {
    id: cliente.id || cliente.documentId || 0,
    nombre: nombre,
    correo: correo,
    telefono: telefono,
    direccion: direccion,
    pedidos: pedidos,
    gastoTotal: gastoTotal,
    fechaRegistro: format(createdDate, 'dd MMM, yyyy'),
    ultimaActividad: ultimaActividad ? format(lastActivityDate, 'dd MMM, yyyy') : undefined,
    status: status,
    url: `/products/clientes/${cliente.id || cliente.documentId || cliente.id}`,
    strapiId: cliente.id,
  }
}

interface ClientesListingProps {
  clientes?: any[]
  error?: string | null
}

const gastoRangeFilterFn: FilterFn<any> = (row, columnId, value) => {
  const gasto = row.getValue<number>(columnId)
  if (!value) return true
  if (value === '10000+') return gasto > 10000
  const [min, max] = value.split('-').map(Number)
  return gasto >= min && gasto <= max
}

const columnHelper = createColumnHelper<ClienteType>()

const ClientesListing = ({ clientes, error }: ClientesListingProps = {}) => {
  // Mapear clientes de Strapi al formato ClienteType si están disponibles
  const mappedClientes = useMemo(() => {
    if (clientes && clientes.length > 0) {
      console.log('[ClientesListing] Clientes recibidos:', clientes.length)
      console.log('[ClientesListing] Primer cliente estructura completa:', JSON.stringify(clientes[0], null, 2))
      const mapped = clientes.map(mapStrapiClienteToClienteType)
      console.log('[ClientesListing] Clientes mapeados:', mapped.length)
      console.log('[ClientesListing] Primer cliente mapeado:', mapped[0])
      return mapped
    }
    console.log('[ClientesListing] No hay clientes de Strapi')
    return []
  }, [clientes])

  const columns: ColumnDef<ClienteType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<ClienteType> }) => (
        <input
          type="checkbox"
          className="form-check-input form-check-input-light fs-14"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: TableRow<ClienteType> }) => (
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
    columnHelper.accessor('nombre', {
      header: 'Cliente',
      cell: ({ row }) => (
        <div className="d-flex">
          <div className="avatar-md me-3 bg-light d-flex align-items-center justify-content-center rounded">
            <LuUser className="text-muted fs-lg" />
          </div>
          <div>
            <h5 className="mb-0">
              <Link href={row.original.url} className="link-reset">
                {row.original.nombre || 'Sin nombre'}
              </Link>
            </h5>
            <p className="text-muted mb-0 fs-xxs">{row.original.correo || 'Sin correo'}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('correo', {
      header: 'Correo',
      cell: ({ row }) => (
        <div className="d-flex align-items-center">
          <LuMail className="me-2 text-muted" />
          <span>{row.original.correo || 'Sin correo'}</span>
        </div>
      ),
    }),
    columnHelper.accessor('telefono', {
      header: 'Teléfono',
      cell: ({ row }) => row.original.telefono || '-',
    }),
    columnHelper.accessor('pedidos', {
      header: 'Pedidos',
      cell: ({ row }) => (
        <div className="d-flex align-items-center">
          <LuShoppingCart className="me-2 text-muted" />
          <span>{row.original.pedidos || 0}</span>
        </div>
      ),
    }),
    columnHelper.accessor('gastoTotal', {
      header: 'Gasto Total',
      filterFn: gastoRangeFilterFn,
      enableColumnFilter: true,
      cell: ({ row }) => (
        <>
          {currency}
          {row.original.gastoTotal.toLocaleString()}
        </>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span
          className={`badge ${row.original.status === 'active' ? 'badge-soft-success' : 'badge-soft-warning'} fs-xxs`}>
          {toPascalCase(row.original.status)}
        </span>
      ),
    }),
    columnHelper.accessor('fechaRegistro', {
      header: 'Fecha Registro',
      cell: ({ row }) => (
        <>
          {row.original.fechaRegistro}
          {row.original.ultimaActividad && (
            <small className="text-muted d-block">Última: {row.original.ultimaActividad}</small>
          )}
        </>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<ClienteType> }) => (
        <div className="d-flex gap-1">
          <Link href={row.original.url}>
            <Button variant="default" size="sm" className="btn-icon rounded-circle">
              <TbEye className="fs-lg" />
            </Button>
          </Link>
          <Link href={`/products/clientes/${row.original.strapiId || row.original.id}/editar`}>
            <Button variant="default" size="sm" className="btn-icon rounded-circle">
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

  const [data, setData] = useState<ClienteType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 })

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  // Actualizar datos cuando cambien los clientes de Strapi
  useEffect(() => {
    console.log('[ClientesListing] useEffect - clientes:', clientes?.length, 'mappedClientes:', mappedClientes.length)
    setData(mappedClientes)
    console.log('[ClientesListing] Datos actualizados. Total:', mappedClientes.length)
  }, [mappedClientes])

  const table = useReactTable<ClienteType>({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination, rowSelection: selectedRowIds },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    enableColumnFilters: true,
    enableRowSelection: true,
    filterFns: {
      gastoRange: gastoRangeFilterFn,
    },
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

  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setPagination({ ...pagination, pageIndex: 0 })
    setShowDeleteModal(false)
  }

  // Mostrar error si existe
  const hasError = !!error
  const hasData = mappedClientes.length > 0
  
  if (hasError && !hasData) {
    return (
      <Row>
        <Col xs={12}>
          <Alert variant="warning">
            <strong>Error al cargar clientes desde Strapi:</strong> {error}
            <br />
            <small className="text-muted">
              Verifica que:
              <ul className="mt-2 mb-0">
                <li>STRAPI_API_TOKEN esté configurado en Railway</li>
                <li>El servidor de Strapi esté disponible</li>
                <li>Las variables de entorno estén correctas</li>
              </ul>
            </small>
          </Alert>
        </Col>
      </Row>
    )
  }
  
  // Si hay error pero también hay datos, mostrar advertencia pero continuar
  if (hasError && hasData) {
    console.warn('[ClientesListing] Error al cargar desde Strapi, usando datos disponibles:', error)
  }

  // Debug: mostrar información sobre los datos
  console.log('[ClientesListing] Render - data.length:', data.length, 'mappedClientes.length:', mappedClientes.length, 'clientes:', clientes?.length)

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
                  placeholder="Buscar cliente por nombre o correo..."
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
                  value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'}
                  onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Estado</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
                <LuUser className="app-search-icon text-muted" />
              </div>

              <div className="app-search">
                <select
                  className="form-select form-control my-1 my-md-0"
                  value={(table.getColumn('gastoTotal')?.getFilterValue() as string) ?? ''}
                  onChange={(e) => table.getColumn('gastoTotal')?.setFilterValue(e.target.value || undefined)}>
                  <option value="">Rango de Gasto</option>
                  <option value="0-1000">$0 - $1,000</option>
                  <option value="1001-5000">$1,001 - $5,000</option>
                  <option value="5001-10000">$5,001 - $10,000</option>
                  <option value="10000+">$10,000+</option>
                </select>
                <LuDollarSign className="app-search-icon text-muted" />
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
            </div>
          </CardHeader>

          <DataTable<ClienteType> table={table} emptyMessage="No se encontraron clientes" />

          {table.getRowModel().rows.length > 0 && (
            <CardFooter className="border-0">
              <TablePagination
                totalItems={totalItems}
                start={start}
                end={end}
                itemsName="clientes"
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
            itemName="cliente"
          />
        </Card>
      </Col>
    </Row>
  )
}

export default ClientesListing

