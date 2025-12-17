/**
 * API Route para obtener un producto específico desde Strapi por ID
 */

import { NextResponse } from 'next/server'
import strapiClient from '@/lib/strapi/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Intentar primero con el ID numérico
    let endpointUsed = `/api/libros/${id}`
    let response: any
    
    try {
      response = await strapiClient.get<any>(
        `${endpointUsed}?populate=*`
      )
      
      // Si la respuesta tiene data, retornarla
      if (response.data) {
        console.log('[API /tienda/productos/[id]] Producto obtenido por ID:', {
          id,
          endpoint: endpointUsed,
          hasData: !!response.data,
        })
        
        return NextResponse.json({
          success: true,
          data: response.data,
        }, { status: 200 })
      }
    } catch (idError: any) {
      console.log('[API /tienda/productos/[id]] Error con ID numérico, intentando con documentId:', {
        id,
        error: idError.message,
      })
    }
    
    // Si falla con ID numérico, intentar buscar por documentId
    // Primero obtener todos los productos y buscar el que coincida
    try {
      const allProducts = await strapiClient.get<any>(
        `/api/libros?populate=*&pagination[pageSize]=1000`
      )
      
      const productos = Array.isArray(allProducts.data) ? allProducts.data : []
      const productoEncontrado = productos.find((p: any) => 
        p.id?.toString() === id || 
        p.documentId === id ||
        p.id === parseInt(id)
      )
      
      if (productoEncontrado) {
        console.log('[API /tienda/productos/[id]] Producto encontrado por búsqueda:', {
          id,
          productoId: productoEncontrado.id,
          documentId: productoEncontrado.documentId,
        })
        
        return NextResponse.json({
          success: true,
          data: productoEncontrado,
        }, { status: 200 })
      }
    } catch (searchError: any) {
      console.error('[API /tienda/productos/[id]] Error en búsqueda:', searchError.message)
    }
    
    // Si no se encontró, retornar error
    return NextResponse.json(
      { 
        success: false,
        error: `Producto con ID ${id} no encontrado`,
        data: null,
      },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('[API /tienda/productos/[id]] Error al obtener producto:', {
      message: error.message,
      status: error.status,
      details: error.details,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al obtener producto',
        data: null,
      },
      { status: error.status || 500 }
    )
  }
}

