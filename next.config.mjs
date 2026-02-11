/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable static generation for API routes
  experimental: {
    workerThreads: false,
    cpus: 1
  }
};

export default nextConfig;
