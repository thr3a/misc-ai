/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  poweredByHeader: false,
  output: 'standalone', // k8sの場合の設定
  experimental: {
    missingSuspenseWithCSRBailout: false
  },
  async headers() {
    return [
      {
        source: '/:path*{/}?', // 全てのパスと末尾スラッシュに対応
        headers: [
          {
            key: 'X-Accel-Buffering',
            value: 'no' // ストリーミングを有効化するためにバッファリングを無効化
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
