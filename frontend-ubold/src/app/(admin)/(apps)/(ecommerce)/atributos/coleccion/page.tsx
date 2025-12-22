import { Suspense } from 'react'
import ColeccionesListing from './components/ColeccionesListing'

async function getColecciones() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/tienda/coleccion`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Error al obtener colecciones')
    }

    const result = await response.json()
    return {
      colecciones: result.data || [],
      error: result.warning || null,
    }
  } catch (error: any) {
    console.error('[page] Error al obtener colecciones:', error.message)
    return {
      colecciones: [],
      error: error.message || 'Error al cargar las colecciones',
    }
  }
}

export default async function ColeccionesPage() {
  const { colecciones, error } = await getColecciones()

  return (
    <div>
      <Suspense fallback={<div>Cargando...</div>}>
        <ColeccionesListing colecciones={colecciones} error={error} />
      </Suspense>
    </div>
  )
}

