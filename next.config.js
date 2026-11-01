/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  poweredByHeader: false,
  output: 'standalone',
  allowedDevOrigins: ['192.168.16.12', 'ubuntu02.local'],
  cacheComponents: false,
  partialPrefetching: false,
  agentRules: false,
  reactCompiler: false
};

module.exports = nextConfig;
