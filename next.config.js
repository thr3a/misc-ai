/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // basePath: process.env.GITHUB_ACTIONS && 'nextjs-template',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  poweredByHeader: false,
  // github pagesの場合
  // output: 'export',
  // k8sの場合
  output: 'standalone'
};

module.exports = nextConfig;
