import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactStrictMode: false,
  output: 'standalone', // Optimiza para producción en Railway
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
};

export default nextConfig;
