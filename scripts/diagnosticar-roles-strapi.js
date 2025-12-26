/**
 * Script para diagnosticar el problema con los roles en Strapi
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi.moraleja.cl'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '13ffe7b786754b89a8636b00c8ae7c968a02fd03848fee117bc20b43c820d39b946bd7e3399f4ce3e9345d698a5ed4183509a93569691a70d1dd0302bdcba694348112a70637ee73ad63db9a2e3c960bb75e949daf6385f87f0442529c70f61f6e107eede650eb506b0c1be0c6fd580dd59c8be1b8fd5ba4e7f0d9f7edb685d3'

async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    console.log(`\n🔍 Probando: ${method} ${url}`)
    const response = await fetch(url, options)
    const text = await response.text()
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    try {
      const json = JSON.parse(text)
      console.log(`   Response:`, JSON.stringify(json, null, 2))
      return { status: response.status, data: json }
    } catch {
      console.log(`   Response (text): ${text.substring(0, 200)}`)
      return { status: response.status, data: text }
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return { error: error.message }
  }
}

async function main() {
  console.log('🔍 Diagnosticando problema con roles en Strapi...\n')
  console.log(`URL: ${STRAPI_URL}`)
  console.log(`Token: ${STRAPI_API_TOKEN.substring(0, 20)}...`)

  // Probar diferentes endpoints
  await testEndpoint(`${STRAPI_URL}/api/users-permissions/roles`)
  await testEndpoint(`${STRAPI_URL}/api/users-permissions/roles?populate=*`)
  await testEndpoint(`${STRAPI_URL}/api/users-permissions/roles/1`)
  
  // Probar endpoint de permisos directamente
  await testEndpoint(`${STRAPI_URL}/api/users-permissions/permissions`)
  
  // Probar si el problema es con el token
  await testEndpoint(`${STRAPI_URL}/api/users/me`)
  
  // Probar endpoint de intranet-chat para ver si funciona
  await testEndpoint(`${STRAPI_URL}/api/intranet-chats?pagination[pageSize]=1`)
}

main().catch(console.error)

