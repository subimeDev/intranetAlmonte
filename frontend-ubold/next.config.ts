import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactStrictMode: false,
  output: 'standalone', // Optimiza para producción en Railway
  // Optimizaciones de compilación
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'strapi.moraleja.cl',
        pathname: '/uploads/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  sassOptions: {
    includePaths: [
      './src/assets/scss',
      './node_modules/bootstrap/scss',
    ],
    silenceDeprecations: ['legacy-js-api'],
  },
  // Optimizaciones experimentales
  experimental: {
    optimizePackageImports: ['@tanstack/react-table', 'react-bootstrap', 'date-fns'],
    // Habilitar build cache para builds más rápidos
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Optimizaciones de build
  swcMinify: true, // Usar SWC para minificación (más rápido que Terser)
};

export default nextConfig;
