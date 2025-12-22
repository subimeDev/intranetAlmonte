import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[API Clientes GET] Obteniendo cliente:', id)

    // Intentar obtener el cliente por ID
    let cliente: any = null
    
    try {
      // Intentar primero con filtro por ID
      const response = await strapiClient.get<any>(`/api/wo-clientes?filters[id][$eq]=${id}&populate=*`)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        cliente = response.data[0]
      } else if (response.data && !Array.isArray(response.data)) {
        cliente = response.data
      } else if (Array.isArray(response) && response.length > 0) {
        cliente = response[0]
      }
    } catch (error: any) {
      console.log('[API Clientes GET] Filtro por ID falló, intentando búsqueda directa...')
      
      // Si falla, intentar obtener todos y buscar
      try {
        const allResponse = await strapiClient.get<any>('/api/wo-clientes?populate=*&pagination[pageSize]=1000')
        const allClientes = Array.isArray(allResponse) 
          ? allResponse 
          : (allResponse.data && Array.isArray(allResponse.data) ? allResponse.data : [])
        
        cliente = allClientes.find((c: any) => 
          c.id?.toString() === id || 
          c.documentId === id ||
          (c.attributes && (c.attributes.id?.toString() === id || c.attributes.documentId === id))
        )
      } catch (searchError: any) {
        console.error('[API Clientes GET] Error en búsqueda:', searchError.message)
      }
    }

    // Si aún no se encontró, intentar endpoint directo
    if (!cliente) {
      try {
        cliente = await strapiClient.get<any>(`/api/wo-clientes/${id}?populate=*`)
        if (cliente.data) {
          cliente = cliente.data
        }
      } catch (directError: any) {
        console.error('[API Clientes GET] Error en endpoint directo:', directError.message)
      }
    }

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: 'Cliente no encontrado'
      }, { status: 404 })
    }

    console.log('[API Clientes GET] ✅ Cliente encontrado:', cliente.id || cliente.documentId)
    
    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error: any) {
    console.error('[API Clientes GET] ❌ Error:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener el cliente'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('[API Clientes PUT] Actualizando cliente:', id, body)

    // Buscar el cliente primero para obtener el ID correcto
    let cliente: any = null
    
    try {
      const response = await strapiClient.get<any>(`/api/wo-clientes?filters[id][$eq]=${id}&populate=*`)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        cliente = response.data[0]
      } else if (response.data && !Array.isArray(response.data)) {
        cliente = response.data
      } else if (Array.isArray(response) && response.length > 0) {
        cliente = response[0]
      }
    } catch (error: any) {
      // Si falla, intentar obtener todos y buscar
      try {
        const allResponse = await strapiClient.get<any>('/api/wo-clientes?populate=*&pagination[pageSize]=1000')
        const allClientes = Array.isArray(allResponse) 
          ? allResponse 
          : (allResponse.data && Array.isArray(allResponse.data) ? allResponse.data : [])
        
        cliente = allClientes.find((c: any) => 
          c.id?.toString() === id || 
          c.documentId === id ||
          (c.attributes && (c.attributes.id?.toString() === id || c.attributes.documentId === id))
        )
      } catch (searchError: any) {
        console.error('[API Clientes PUT] Error en búsqueda:', searchError.message)
      }
    }

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: 'Cliente no encontrado'
      }, { status: 404 })
    }

    // En Strapi v4, usar documentId (string) para actualizar, no el id numérico
    const clienteDocumentId = cliente.documentId || cliente.data?.documentId || cliente.id?.toString() || id
    console.log('[API Clientes PUT] Usando documentId para actualizar:', clienteDocumentId)

    // Preparar datos de actualización
    const updateData: any = {
      data: {},
    }

    if (body.data.nombre !== undefined) {
      updateData.data.nombre = body.data.nombre
    }
    if (body.data.correo_electronico !== undefined) {
      updateData.data.correo_electronico = body.data.correo_electronico
    }
    if (body.data.telefono !== undefined) {
      updateData.data.telefono = body.data.telefono
    }
    if (body.data.direccion !== undefined) {
      updateData.data.direccion = body.data.direccion
    }
    if (body.data.pedidos !== undefined) {
      updateData.data.pedidos = typeof body.data.pedidos === 'number' ? body.data.pedidos : parseInt(body.data.pedidos) || 0
    }
    if (body.data.gasto_total !== undefined) {
      updateData.data.gasto_total = typeof body.data.gasto_total === 'number' ? body.data.gasto_total : parseFloat(body.data.gasto_total) || 0
    }
    if (body.data.fecha_registro !== undefined) {
      updateData.data.fecha_registro = body.data.fecha_registro
    }
    if (body.data.ultima_actividad !== undefined) {
      updateData.data.ultima_actividad = body.data.ultima_actividad
    }

    const response = await strapiClient.put(`/api/wo-clientes/${clienteDocumentId}`, updateData)
    
    console.log('[API Clientes PUT] ✅ Cliente actualizado:', clienteDocumentId)
    
    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('[API Clientes PUT] ❌ Error:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al actualizar el cliente'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[API Clientes DELETE] Eliminando cliente:', id)

    // Buscar el cliente primero para obtener el ID correcto
    let cliente: any = null
    
    try {
      const response = await strapiClient.get<any>(`/api/wo-clientes?filters[id][$eq]=${id}&populate=*`)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        cliente = response.data[0]
      } else if (response.data && !Array.isArray(response.data)) {
        cliente = response.data
      } else if (Array.isArray(response) && response.length > 0) {
        cliente = response[0]
      }
    } catch (error: any) {
      // Si falla, intentar obtener todos y buscar
      try {
        const allResponse = await strapiClient.get<any>('/api/wo-clientes?populate=*&pagination[pageSize]=1000')
        const allClientes = Array.isArray(allResponse) 
          ? allResponse 
          : (allResponse.data && Array.isArray(allResponse.data) ? allResponse.data : [])
        
        cliente = allClientes.find((c: any) => 
          c.id?.toString() === id || 
          c.documentId === id ||
          (c.attributes && (c.attributes.id?.toString() === id || c.attributes.documentId === id))
        )
      } catch (searchError: any) {
        console.error('[API Clientes DELETE] Error en búsqueda:', searchError.message)
      }
    }

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: 'Cliente no encontrado'
      }, { status: 404 })
    }

    // En Strapi v4, usar documentId (string) para eliminar, no el id numérico
    const clienteDocumentId = cliente.documentId || cliente.data?.documentId || cliente.id?.toString() || id
    console.log('[API Clientes DELETE] Usando documentId para eliminar:', clienteDocumentId)

    await strapiClient.delete(`/api/wo-clientes/${clienteDocumentId}`)
    
    console.log('[API Clientes DELETE] ✅ Cliente eliminado:', clienteDocumentId)
    
    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    })
  } catch (error: any) {
    console.error('[API Clientes DELETE] ❌ Error:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al eliminar el cliente'
    }, { status: 500 })
  }
}

