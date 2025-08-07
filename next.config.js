/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  poweredByHeader: false,
  output: 'standalone' // k8sの場合の設定
};

module.exports = nextConfig;
