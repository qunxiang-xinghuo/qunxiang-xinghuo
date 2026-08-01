/**
 * Next.js 配置
 * 包含 HTTPS 重定向和安全头配置
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 启用 HTTPS 重定向（生产环境）
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://qunxiangxinghuo.cn/:path*',
          permanent: true,
        },
      ];
    }
    return [];
  },

  // 安全头配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // React Strict Mode
  reactStrictMode: true,

  // 图片优化
  images: {
    domains: ['qunxiangxinghuo.cn'],
  },
};

export default nextConfig;
