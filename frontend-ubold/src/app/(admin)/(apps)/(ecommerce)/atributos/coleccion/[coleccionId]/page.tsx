import { Suspense } from 'react'
import ColeccionDetails from './components/ColeccionDetails'

async function getColeccion(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/tienda/coleccion/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Error al obtener la colección')
    }

    const result = await response.json()
    return {
      coleccion: result.data || null,
      error: null,
    }
  } catch (error: any) {
    console.error('[page] Error al obtener coleccion:', error.message)
    return {
      coleccion: null,
      error: error.message || 'Error al cargar la colección',
    }
  }
}

export default async function ColeccionDetailsPage({
  params,
}: {
  params: { coleccionId: string }
}) {
  const { coleccion, error } = await getColeccion(params.coleccionId)

  return (
    <div>
      <Suspense fallback={<div>Cargando...</div>}>
        <ColeccionDetails coleccion={coleccion} coleccionId={params.coleccionId} error={error} />
      </Suspense>
    </div>
  )
}

