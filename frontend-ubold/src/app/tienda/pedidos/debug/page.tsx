import { Container, Card, CardBody, Alert } from 'react-bootstrap'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import strapiClient from '@/lib/strapi/client'
import { STRAPI_API_URL } from '@/lib/strapi/config'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

/**
 * Página de debug para ver la estructura exacta de los datos que vienen de Strapi
 */
export default async function PedidosDebugPage() {
  let rawData: any = null
  let error: string | null = null

  try {
    // Intentar obtener pedidos desde Strapi
    let response: any = null
    
    // Intentar primero con "ecommerce-pedidos"
    try {
      response = await strapiClient.get<any>('/api/ecommerce-pedidos?populate=*&pagination[pageSize]=1')
    } catch {
      // Si falla, intentar con "wo-pedidos"
      try {
        response = await strapiClient.get<any>('/api/wo-pedidos?populate=*&pagination[pageSize]=1')
      } catch {
        // Último intento con "pedidos"
        response = await strapiClient.get<any>('/api/pedidos?populate=*&pagination[pageSize]=1')
      }
    }
    
    rawData = response
  } catch (err: any) {
    error = err.message || 'Error al conectar con Strapi'
    console.error('Error al obtener pedidos:', err)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title="Debug Pedidos" subtitle="Ver estructura de datos" />
      
      <div className="row">
        <div className="col-12">
          <Card>
            <CardBody>
              <h4 className="card-title mb-4">Estructura de Datos de Strapi</h4>
              
              <Alert variant="info" className="mb-3">
                <strong>Endpoint usado:</strong> {STRAPI_API_URL}
                <br />
                Esta página muestra la estructura exacta de los datos que vienen de Strapi
                para poder mapearlos correctamente en la página de pedidos.
              </Alert>

              {error && (
                <Alert variant="danger">
                  <strong>Error:</strong> {error}
                </Alert>
              )}

              {rawData && (
                <>
                  <h5 className="mt-4 mb-3">Datos completos (JSON):</h5>
                  <pre className="bg-light p-3 rounded" style={{ fontSize: '12px', maxHeight: '600px', overflow: 'auto' }}>
                    {JSON.stringify(rawData, null, 2)}
                  </pre>

                  {rawData.data && rawData.data.length > 0 && (
                    <>
                      <h5 className="mt-4 mb-3">Primer pedido (estructura):</h5>
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Campo</th>
                              <th>Valor</th>
                              <th>Tipo</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><code>id</code></td>
                              <td>{rawData.data[0].id}</td>
                              <td>{typeof rawData.data[0].id}</td>
                            </tr>
                            {rawData.data[0].attributes && Object.keys(rawData.data[0].attributes).map((key) => (
                              <tr key={key}>
                                <td><code>attributes.{key}</code></td>
                                <td>
                                  {typeof rawData.data[0].attributes[key] === 'object' 
                                    ? JSON.stringify(rawData.data[0].attributes[key])
                                    : String(rawData.data[0].attributes[key])}
                                </td>
                                <td>{typeof rawData.data[0].attributes[key]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  )
}

