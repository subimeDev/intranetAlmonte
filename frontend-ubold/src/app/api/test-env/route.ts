/**
 * Ruta de prueba para verificar variables de entorno
 * Visita: /api/test-env
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    // Variables de Strapi
    hasStrapiToken: !!process.env.STRAPI_API_TOKEN,
    strapiTokenLength: process.env.STRAPI_API_TOKEN?.length || 0,
    strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.moraleja.cl',
    
    // Variables de WooCommerce
    hasWooCommerceKey: !!process.env.WOOCOMMERCE_CONSUMER_KEY,
    wooCommerceKeyLength: process.env.WOOCOMMERCE_CONSUMER_KEY?.length || 0,
    hasWooCommerceSecret: !!process.env.WOOCOMMERCE_CONSUMER_SECRET,
    wooCommerceSecretLength: process.env.WOOCOMMERCE_CONSUMER_SECRET?.length || 0,
    wooCommerceUrl: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'https://staging.escolar.cl',
    
    // Entorno
    nodeEnv: process.env.NODE_ENV,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT,
    
    // Todas las variables que empiezan con STRAPI o WOOCOMMERCE
    allStrapiVars: Object.keys(process.env).filter(key => key.includes('STRAPI')),
    allWooCommerceVars: Object.keys(process.env).filter(key => key.includes('WOOCOMMERCE')),
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

