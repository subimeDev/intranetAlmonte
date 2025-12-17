/**
 * API Route para subir imágenes a Strapi
 */

import { NextRequest, NextResponse } from 'next/server'
import { STRAPI_API_URL, STRAPI_API_TOKEN } from '@/lib/strapi/config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }
    
    // Crear FormData para Strapi
    const strapiFormData = new FormData()
    strapiFormData.append('files', file)
    
    // Subir a Strapi
    const response = await fetch(`${STRAPI_API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: strapiFormData,
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Error al subir: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Strapi devuelve un array de archivos subidos
    const uploadedFile = Array.isArray(data) ? data[0] : data
    
    return NextResponse.json({
      success: true,
      data: uploadedFile,
      id: uploadedFile.id,
      url: uploadedFile.url ? `${STRAPI_API_URL}${uploadedFile.url}` : null,
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API /tienda/upload] Error al subir archivo:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al subir archivo',
      },
      { status: 500 }
    )
  }
}

