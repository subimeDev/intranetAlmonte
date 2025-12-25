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
    // Optimizar compilación
    webpackBuildWorker: true,
  },
  // Reducir tamaño del bundle (SWC minify es el default en Next.js 16)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
