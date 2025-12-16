import { Container, Alert, Card, CardBody, Badge } from 'react-bootstrap'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import strapiClient from '@/lib/strapi/client'
import { STRAPI_API_URL } from '@/lib/strapi/config'
import ProductosGrid from './components/ProductosGrid'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
  let productos: any[] = []
  let error: string | null = null

  try {
    // Intentar obtener productos desde Strapi
    // Probamos con diferentes endpoints según las colecciones disponibles
    let response: any = null
    
    // Endpoint correcto: product-libro-edicion (según la URL de Strapi)
    try {
      response = await strapiClient.get<any>('/api/product-libro-edicion?populate=*&pagination[pageSize]=100')
    } catch {
      // Fallbacks por si acaso
      try {
        response = await strapiClient.get<any>('/api/product-libro-edicions?populate=*&pagination[pageSize]=100')
      } catch {
        try {
          response = await strapiClient.get<any>('/api/producto-libro-edicion?populate=*&pagination[pageSize]=100')
        } catch {
          response = await strapiClient.get<any>('/api/producto?populate=*&pagination[pageSize]=100')
        }
      }
    }
    
    // Strapi devuelve los datos en response.data
    if (Array.isArray(response.data)) {
      productos = response.data
    } else if (response.data) {
      productos = [response.data]
    }
  } catch (err: any) {
    error = err.message || 'Error al conectar con Strapi'
    
    if (process.env.NODE_ENV !== 'production' || typeof window !== 'undefined') {
      console.error('Error al obtener productos:', err)
    }
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Gestionar Productos" subtitle="Tienda" />
      
      <div className="row">
        <div className="col-12">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="card-title mb-0">Productos de Strapi</h4>
                {!error && productos.length > 0 && (
                  <Badge bg="success" className="fs-6 px-3 py-2">
                    {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
                  </Badge>
                )}
              </div>
              
              {/* Mostrar información de conexión */}
              <Alert variant="info" className="mb-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>URL de Strapi:</strong> {STRAPI_API_URL}
                    <br />
                    <small className="text-muted">
                      Endpoint: <code>/api/product-libro-edicion</code>
                      <br />
                      <a href="/tienda/productos/debug" className="text-decoration-underline">
                        🔍 Ver diagnóstico completo
                      </a>
                    </small>
                  </div>
                  <a href="/tienda/productos/debug" className="text-decoration-underline">
                    🔍 Diagnóstico
                  </a>
                </div>
              </Alert>

              {/* Mostrar error si existe */}
              {error && (
                <Alert variant="danger" className="mb-3">
                  <strong>⚠️ Error:</strong> {error}
                  <br />
                  <br />
                  <strong>🔧 Pasos para solucionar:</strong>
                  <ol className="mb-0 mt-2">
                    <li>
                      <strong>Configurar permisos en Strapi:</strong>
                      <ul className="mb-2">
                        <li>Ve a Strapi Admin → <strong>Settings</strong> → <strong>Users & Permissions plugin</strong> → <strong>Roles</strong></li>
                        <li>Haz clic en <strong>"Public"</strong></li>
                        <li>Busca <strong>"Product · Libro · Edición"</strong> o <strong>"product-libro-edicion"</strong></li>
                        <li>Marca la casilla <strong>"find"</strong></li>
                        <li>Haz clic en <strong>"Save"</strong></li>
                      </ul>
                    </li>
                    <li>
                      <strong>Verificar API Token:</strong>
                      <ul className="mb-2">
                        <li>Ve a <strong>Settings</strong> → <strong>Users & Permissions plugin</strong> → <strong>API Tokens</strong></li>
                        <li>Verifica que tu token tenga permisos de <strong>"Read"</strong> o <strong>"Full access"</strong></li>
                        <li>Verifica que el token esté configurado en Railway (variable <code>STRAPI_API_TOKEN</code>)</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Probar manualmente:</strong>
                      <br />
                      <code className="d-block mt-1 p-2 bg-light rounded">
                        https://strapi.moraleja.cl/api/product-libro-edicion?populate=*
                      </code>
                      <small className="text-muted">(Agrega el header Authorization: Bearer TU_TOKEN)</small>
                    </li>
                  </ol>
                  <div className="mt-3">
                    <a href="/tienda/productos/debug" className="btn btn-sm btn-outline-primary me-2">
                      🔍 Ver Diagnóstico Completo
                    </a>
                    <a 
                      href="https://strapi.moraleja.cl/admin/settings/users-permissions/roles" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-secondary"
                    >
                      ⚙️ Configurar Permisos en Strapi
                    </a>
                  </div>
                </Alert>
              )}

              {/* Grid de Productos */}
              <ProductosGrid productos={productos} error={error} />
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  )
}

