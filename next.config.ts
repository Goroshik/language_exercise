import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next 16 removed the `eslint` config key — builds no longer run ESLint,
  // so `ignoreDuringBuilds: true` is now the default behaviour.
  typescript: {
    ignoreBuildErrors: false
  },
  // Enable standalone output for Docker deployments
  output: 'standalone'
};

export default nextConfig;
