import { NextRequest, NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'
import { logActivity, createLogDescription } from '@/lib/logging'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Validar que el ID no sea una palabra reservada
    const reservedWords = ['productos', 'categorias', 'etiquetas', 'pedidos', 'facturas', 'marcas', 'obras', 'sellos', 'serie-coleccion']
    if (reservedWords.includes(id.toLowerCase())) {
      console.warn('[API /tienda/autores/[id] PUT] ⚠️ Intento de acceso a ruta reservada:', id)
      return NextResponse.json(
        { 
          success: false,
          error: `Ruta no válida. La ruta /api/tienda/autores/${id} no existe. Use /api/tienda/${id} en su lugar.`,
          data: null,
          hint: `Si está buscando ${id}, use el endpoint: /api/tienda/${id}`,
        },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    console.log('[API Autores PUT] ✏️ Actualizando autor:', id, body)

    const autorEndpoint = '/api/autores'
    
    // Primero obtener el autor de Strapi para obtener el documentId
    let autorStrapi: any
    let documentId: string | null = null
    try {
      const autorResponse = await strapiClient.get<any>(`${autorEndpoint}?filters[id][$eq]=${id}&populate=*`)
      let autores: any[] = []
      if (Array.isArray(autorResponse)) {
        autores = autorResponse
      } else if (autorResponse.data && Array.isArray(autorResponse.data)) {
        autores = autorResponse.data
      } else if (autorResponse.data) {
        autores = [autorResponse.data]
      }
      autorStrapi = autores[0]
      documentId = autorStrapi?.documentId || autorStrapi?.data?.documentId || id
    } catch (error: any) {
      console.warn('[API Autores PUT] ⚠️ No se pudo obtener autor de Strapi:', error.message)
      documentId = id
    }

    // Actualizar en Strapi usando documentId si está disponible
    const strapiEndpoint = documentId ? `${autorEndpoint}/${documentId}` : `${autorEndpoint}/${id}`
    console.log('[API Autores PUT] Usando endpoint Strapi:', strapiEndpoint, { documentId, id })

    // El schema de Strapi para autor usa varios campos
    const autorData: any = {
      data: {}
    }

<<<<<<< HEAD
    // En Strapi v4, usar documentId (string) para actualizar, no el id numérico
    const autorDocumentId = autor.documentId || autor.data?.documentId || autor.id?.toString() || id
    console.log('[API Autores PUT] Usando documentId para actualizar:', autorDocumentId)

    // Obtener estado_publicacion actual del autor antes de actualizar
    // IMPORTANTE: Strapi espera valores en minúsculas: "pendiente", "publicado", "borrador"
    const estadoActual = autor.attributes?.estado_publicacion || autor.estado_publicacion || 'pendiente'
    const nuevoEstadoRaw = body.data.estado_publicacion !== undefined ? body.data.estado_publicacion : estadoActual
    // Normalizar a minúsculas para Strapi
    const nuevoEstado = typeof nuevoEstadoRaw === 'string' ? nuevoEstadoRaw.toLowerCase() : nuevoEstadoRaw

    // Preparar datos de actualización
    const updateData: any = {
      data: {},
    }

    if (body.data.nombre_completo_autor !== undefined) {
      updateData.data.nombre_completo_autor = body.data.nombre_completo_autor
    }
    if (body.data.nombres !== undefined) {
      updateData.data.nombres = body.data.nombres
    }
    if (body.data.primer_apellido !== undefined) {
      updateData.data.primer_apellido = body.data.primer_apellido
    }
    if (body.data.segundo_apellido !== undefined) {
      updateData.data.segundo_apellido = body.data.segundo_apellido
    }
    if (body.data.tipo_autor !== undefined) {
      updateData.data.tipo_autor = body.data.tipo_autor
    }
    if (body.data.website !== undefined) {
      updateData.data.website = body.data.website
    }
    if (body.data.pais !== undefined) {
      updateData.data.pais = body.data.pais
    }
    if (body.data.foto !== undefined) {
      updateData.data.foto = body.data.foto
    }
    if (body.data.estado_publicacion !== undefined) {
      updateData.data.estado_publicacion = body.data.estado_publicacion
    }

    console.log('[API Autores PUT] Estado actual:', estadoActual, '→ Nuevo estado:', nuevoEstado)

    const response = await strapiClient.put(`/api/autores/${autorDocumentId}`, updateData)
    
    // IMPORTANTE: 
    // - Si nuevoEstado = "publicado" (minúscula) → Strapi debería publicarlo y sincronizarlo con WordPress (ambos: escolar y moraleja)
    // - Si nuevoEstado = "pendiente" o "borrador" (minúsculas) → Solo se actualiza en Strapi, NO se publica en WordPress
    // La sincronización con WordPress se maneja en los lifecycles de Strapi basándose en estado_publicacion
    
    console.log('[API Autores PUT] ✅ Autor actualizado:', autorDocumentId)
    console.log('[API Autores PUT]', nuevoEstado === 'publicado' 
      ? '✅ Se publicará en WordPress (si está configurado en Strapi)' 
      : '⏸️ Solo actualizado en Strapi, no se publica en WordPress')
=======
    // Aceptar diferentes formatos del formulario pero guardar según schema real
    if (body.data?.nombre_completo_autor) autorData.data.nombre_completo_autor = body.data.nombre_completo_autor.trim()
    if (body.data?.nombreCompletoAutor) autorData.data.nombre_completo_autor = body.data.nombreCompletoAutor.trim()
    
    if (body.data?.nombres !== undefined) autorData.data.nombres = body.data.nombres?.trim() || null
    if (body.data?.primer_apellido !== undefined) autorData.data.primer_apellido = body.data.primer_apellido?.trim() || null
    if (body.data?.segundo_apellido !== undefined) autorData.data.segundo_apellido = body.data.segundo_apellido?.trim() || null
>>>>>>> origin/matiRama2
    
    if (body.data?.website !== undefined) autorData.data.website = body.data.website?.trim() || null
    if (body.data?.pais !== undefined) autorData.data.pais = body.data.pais
    if (body.data?.tipo_autor !== undefined) autorData.data.tipo_autor = body.data.tipo_autor

    // Media: solo el ID (o null para eliminar)
    if (body.data?.foto !== undefined) {
      autorData.data.foto = body.data.foto || null
    }

    // Estado de publicación
    if (body.estado_publicacion !== undefined && body.estado_publicacion !== '') {
      autorData.data.estado_publicacion = body.estado_publicacion
    }
    if (body.data?.estado_publicacion !== undefined && body.data.estado_publicacion !== '') {
      autorData.data.estado_publicacion = body.data.estado_publicacion
    }

    // Guardar datos anteriores para el log
    const attrsAnteriores = autorStrapi?.attributes || {}
    const datosAnteriores = (attrsAnteriores && Object.keys(attrsAnteriores).length > 0) ? attrsAnteriores : autorStrapi
    const nombreAnterior = datosAnteriores?.nombre_completo_autor || 'N/A'
    
    const strapiResponse = await strapiClient.put<any>(strapiEndpoint, autorData)
    console.log('[API Autores PUT] ✅ Autor actualizado en Strapi')
    
    // Registrar log de actualización
    const nombreNuevo = autorData.data.nombre_completo_autor || nombreAnterior
    logActivity(request, {
      accion: 'actualizar',
      entidad: 'autor',
      entidadId: documentId || id,
      descripcion: createLogDescription('actualizar', 'autor', nombreNuevo, `Autor "${nombreNuevo}"`),
      datosAnteriores: datosAnteriores ? { nombre_completo: nombreAnterior } : undefined,
      datosNuevos: autorData.data,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
<<<<<<< HEAD
      data: response,
      message: nuevoEstado === 'publicado' && estadoActual !== 'publicado'
        ? 'Autor actualizado y se publicará en WordPress'
        : nuevoEstado !== 'publicado' && estadoActual === 'publicado'
        ? 'Autor actualizado (ya no se publica en WordPress)'
        : 'Autor actualizado'
=======
      data: strapiResponse.data || strapiResponse,
      message: 'Autor actualizado exitosamente'
>>>>>>> origin/matiRama2
    })

  } catch (error: any) {
    console.error('[API Autores PUT] ❌ ERROR al actualizar autor:', {
      message: error.message,
      status: error.status,
      details: error.details,
    })
    
    return NextResponse.json({
      success: false,
<<<<<<< HEAD
      error: error.message || 'Error al actualizar el autor'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar rol del usuario
    const colaboradorCookie = request.cookies.get('auth_colaborador')?.value
    if (colaboradorCookie) {
      try {
        const colaborador = JSON.parse(colaboradorCookie)
        if (colaborador.rol !== 'super_admin') {
          return NextResponse.json({
            success: false,
            error: 'No tienes permisos para eliminar autores'
          }, { status: 403 })
        }
      } catch (e) {
        // Si hay error parseando, continuar (podría ser que no esté autenticado)
      }
    }

    const { id } = await params
    console.log('[API Autores DELETE] 🗑️ Eliminando autor:', id)

    // Buscar el autor primero para obtener el ID correcto y verificar estado_publicacion
    let autor: any = null
    let estadoPublicacion: string | null = null
    
    try {
      const response = await strapiClient.get<any>(`/api/autores?filters[id][$eq]=${id}&populate=*`)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        autor = response.data[0]
      } else if (response.data && !Array.isArray(response.data)) {
        autor = response.data
      } else if (Array.isArray(response) && response.length > 0) {
        autor = response[0]
      }
    } catch (error: any) {
      // Si falla, intentar obtener todos y buscar
      try {
        const allResponse = await strapiClient.get<any>('/api/autores?populate=*&pagination[pageSize]=1000')
        const allAutores = Array.isArray(allResponse) 
          ? allResponse 
          : (allResponse.data && Array.isArray(allResponse.data) ? allResponse.data : [])
        
        autor = allAutores.find((a: any) => 
          a.id?.toString() === id || 
          a.documentId === id ||
          (a.attributes && (a.attributes.id?.toString() === id || a.attributes.documentId === id))
        )
      } catch (searchError: any) {
        console.error('[API Autores DELETE] Error en búsqueda:', searchError.message)
      }
    }

    if (!autor) {
      return NextResponse.json({
        success: false,
        error: 'Autor no encontrado'
      }, { status: 404 })
    }

    // Obtener estado_publicacion del autor
    const attrs = autor.attributes || {}
    const data = (attrs && Object.keys(attrs).length > 0) ? attrs : autor
    estadoPublicacion = data.estado_publicacion || data.estadoPublicacion || null
    
    console.log('[API Autores DELETE] Estado de publicación:', estadoPublicacion)
    
    // Normalizar estado a minúsculas para comparación
    if (estadoPublicacion) {
      estadoPublicacion = estadoPublicacion.toLowerCase()
    }

    // En Strapi v4, usar documentId (string) para eliminar, no el id numérico
    const autorDocumentId = autor.documentId || autor.data?.documentId || autor.id?.toString() || id
    console.log('[API Autores DELETE] Usando documentId para eliminar:', autorDocumentId)

    await strapiClient.delete(`/api/autores/${autorDocumentId}`)
    
    if (estadoPublicacion === 'publicado') {
      console.log('[API Autores DELETE] ✅ Autor eliminado en Strapi. El lifecycle eliminará de WooCommerce si estaba publicado.')
    } else {
      console.log('[API Autores DELETE] ✅ Autor eliminado en Strapi (solo Strapi, no estaba publicada en WooCommerce)')
    }
    
    return NextResponse.json({
      success: true,
      message: estadoPublicacion === 'publicado' 
        ? 'Autor eliminado exitosamente en Strapi. El lifecycle eliminará de WooCommerce.' 
        : 'Autor eliminado exitosamente en Strapi'
    })
  } catch (error: any) {
    console.error('[API Autores DELETE] ❌ Error:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al eliminar el autor'
    }, { status: 500 })
=======
      error: error.message || 'Error al actualizar el autor',
      details: error.details
    }, { status: error.status || 500 })
>>>>>>> origin/matiRama2
  }
}

