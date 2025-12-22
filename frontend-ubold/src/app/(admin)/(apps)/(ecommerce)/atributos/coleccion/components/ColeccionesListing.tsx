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
import { Button, Card, CardFooter, CardHeader, Col, Row, Alert } from 'react-bootstrap'
import { LuBox, LuSearch } from 'react-icons/lu'
import { TbEdit, TbEye, TbPlus, TbTrash } from 'react-icons/tb'

import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

// Tipo para la tabla
type ColeccionType = {
  id: number
  name: string
  descripcion: string
  status: 'active' | 'inactive'
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

// Función para mapear colecciones de Strapi al formato ColeccionType
const mapStrapiColeccionToColeccionType = (coleccion: any): ColeccionType => {
  const attrs = coleccion.attributes || {}
  const data = (attrs && Object.keys(attrs).length > 0) ? attrs : (coleccion as any)

  const nombre = getField(data, 'nombre', 'titulo', 'name', 'title', 'NOMBRE', 'TITULO', 'NAME', 'TITLE') || 'Sin nombre'
  const descripcion = getField(data, 'descripcion', 'description', 'DESCRIPCION') || ''
  
  const isPublished = !!(attrs.publishedAt || (coleccion as any).publishedAt)
  
  const createdAt = attrs.createdAt || (coleccion as any).createdAt || new Date().toISOString()
  const createdDate = new Date(createdAt)
  
  return {
    id: coleccion.id || coleccion.documentId || coleccion.id,
    name: nombre,
    descripcion: descripcion,
    status: isPublished ? 'active' : 'inactive',
    date: format(createdDate, 'dd MMM, yyyy'),
    time: format(createdDate, 'h:mm a'),
    url: `/atributos/coleccion/${coleccion.id || coleccion.documentId || coleccion.id}`,
  }
}

interface ColeccionesListingProps {
  colecciones?: any[]
  error?: string | null
}

const columnHelper = createColumnHelper<ColeccionType>()

const ColeccionesListing = ({ colecciones, error }: ColeccionesListingProps = {}) => {
  const router = useRouter()
  
  const mappedColecciones = useMemo(() => {
    if (colecciones && colecciones.length > 0) {
      console.log('[ColeccionesListing] Colecciones recibidas:', colecciones.length)
      const mapped = colecciones.map(mapStrapiColeccionToColeccionType)
      console.log('[ColeccionesListing] Colecciones mapeadas:', mapped.length)
      return mapped
    }
    console.log('[ColeccionesListing] No hay colecciones de Strapi')
    return []
  }, [colecciones])

  const columns: ColumnDef<ColeccionType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<ColeccionType> }) => (
        <input
          type="checkbox"
          className="form-check-input"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: TableRow<ColeccionType> }) => (
        <input
          type="checkbox"
          className="form-check-input"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    columnHelper.accessor('name', {
      header: 'NOMBRE',
      cell: ({ row }) => (
        <Link href={row.original.url} className="text-primary fw-semibold">
          {row.original.name}
        </Link>
      ),
    }),
    columnHelper.accessor('descripcion', {
      header: 'DESCRIPCIÓN',
      cell: ({ row }) => (
        <span className="text-muted">{row.original.descripcion || '-'}</span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'ESTADO',
      cell: ({ row }) => (
        <span className={`badge bg-${row.original.status === 'active' ? 'success' : 'secondary'}`}>
          {row.original.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      ),
    }),
    columnHelper.accessor('date', {
      header: 'FECHA',
      cell: ({ row }) => (
        <div>
          <div className="fw-semibold">{row.original.date}</div>
          <div className="text-muted small">{row.original.time}</div>
        </div>
      ),
    }),
    {
      id: 'actions',
      header: 'ACCIONES',
      cell: ({ row }: { row: TableRow<ColeccionType> }) => (
        <div className="d-flex gap-1">
          <Button
            variant="light"
            size="sm"
            className="btn-icon"
            onClick={() => router.push(row.original.url)}
          >
            <TbEye size={16} />
          </Button>
          <Button
            variant="light"
            size="sm"
            className="btn-icon"
            onClick={() => router.push(`${row.original.url}/edit`)}
          >
            <TbEdit size={16} />
          </Button>
        </div>
      ),
    },
  ]

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedRows, setSelectedRows] = useState<TableRow<ColeccionType>[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<ColeccionType | null>(null)
  const [deleting, setDeleting] = useState(false)

  const table = useReactTable({
    data: mappedColecciones,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  })

  const handleDeleteClick = (coleccion: ColeccionType) => {
    setRowToDelete(coleccion)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!rowToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/tienda/coleccion/${rowToDelete.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al eliminar la colección')
      }

      // Recargar la página para actualizar la lista
      router.refresh()
      setDeleteModalOpen(false)
      setRowToDelete(null)
    } catch (error: any) {
      console.error('[ColeccionesListing] Error al eliminar:', error)
      alert(`Error al eliminar: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <Alert variant="danger">
        <strong>Error:</strong> {error}
      </Alert>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">Todas las Colecciones</h5>
            <p className="text-muted mb-0 mt-1 small">
              Gestiona las colecciones de productos en el sistema.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={() => router.push('/atributos/coleccion/agregar')}
            >
              <TbPlus size={18} className="me-1" />
              Agregar Colección
            </Button>
          </div>
        </CardHeader>

        <div className="card-body">
          <Row className="mb-3">
            <Col md={6}>
              <div className="input-group">
                <span className="input-group-text">
                  <LuSearch size={18} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar colecciones..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
            </Col>
          </Row>

          {mappedColecciones.length === 0 ? (
            <div className="text-center py-5">
              <LuBox size={48} className="text-muted mb-3" />
              <p className="text-muted">No se encontraron colecciones.</p>
              <Button
                variant="primary"
                onClick={() => router.push('/atributos/coleccion/agregar')}
              >
                <TbPlus size={18} className="me-1" />
                Agregar Primera Colección
              </Button>
            </div>
          ) : (
            <>
              <DataTable table={table} />
              <TablePagination table={table} />
            </>
          )}
        </div>
      </Card>

      <DeleteConfirmationModal
        show={deleteModalOpen}
        onHide={() => {
          setDeleteModalOpen(false)
          setRowToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Colección"
        message={`¿Estás seguro de que deseas eliminar la colección "${rowToDelete?.name}"? Esta acción no se puede deshacer.`}
        deleting={deleting}
      />
    </>
  )
}

export default ColeccionesListing

