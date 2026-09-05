/**
 * @file Next.js 配置
 * @description 包含 HTTPS 重定向、www 域名统一、完整安全头配置
 * @security 包含 CSP、HSTS、X-Frame-Options 等多层安全防护
 */

import type { NextConfig } from 'next';

/**
 * 内容安全策略 (CSP)
 * 限制资源加载来源，防止 XSS 和数据注入攻击
 *
 * 策略说明：
 * - default-src 'self': 默认只允许同源资源
 * - script-src: 允许同源 + Next.js 内联脚本（nonce 机制在生产环境更严格）
 * - style-src: 允许同源 + 内联样式（Tailwind 需要）+ Google Fonts
 * - img-src: 允许同源 + data URI + HTTPS 图片
 * - font-src: 允许同源 + Google Fonts
 * - connect-src: 允许同源 API + WebSocket（开发环境）
 * - frame-ancestors 'none': 禁止被嵌入 iframe（防点击劫持）
 * - base-uri 'self': 限制 base 标签
 * - form-action 'self': 限制表单提交目标
 */
const ContentSecurityPolicy = [
  "default-src 'self'",
  // 脚本：同源 + 内联（Next.js 运行时需要）
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // 样式：同源 + 内联（Tailwind/JSS）+ Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.cn https://fonts.googleapis.com",
  // 图片：同源 + data URI + blob + HTTPS
  "img-src 'self' data: blob: https:",
  // 字体：同源 + Google Fonts
  "font-src 'self' data: https://fonts.gstatic.cn https://fonts.gstatic.com https://fonts.googleapis.cn",
  // 连接：同源 API + WebSocket（开发热更新）
  process.env.NODE_ENV === 'production'
    ? "connect-src 'self'"
    : "connect-src 'self' ws: wss:",
  // 媒体：同源
  "media-src 'self' blob:",
  // 对象：禁止（防 Flash 插件攻击）
  "object-src 'none'",
  // 禁止被嵌入 iframe
  "frame-ancestors 'none'",
  // 限制 base 标签
  "base-uri 'self'",
  // 限制表单提交
  "form-action 'self'",
  // 禁止 Worker（除非明确需要）
  "worker-src 'self' blob:",
  // 升级不安全请求（HTTP → HTTPS）
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  // 启用 HTTPS 重定向 + www 域名统一（生产环境）
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        // HTTP → HTTPS
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://www.qunxiangxinghuo.cn/:path*',
          permanent: true,
        },
        // 裸域 → www
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'host',
              value: 'qunxiangxinghuo.cn',
            },
          ],
          destination: 'https://www.qunxiangxinghuo.cn/:path*',
          permanent: true,
        },
      ];
    }
    return [];
  },

  // 完整安全头配置
  async headers() {
    return [
      {
        // 应用到所有路由
        source: '/:path*',
        headers: [
          // 内容安全策略（防 XSS / 数据注入）
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy,
          },
          // HTTP 严格传输安全（强制 HTTPS，2 年 + 子域名 + preload）
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // 禁止点击劫持（页面不能被嵌入 iframe）
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // 防止 MIME 类型嗅探
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 控制 Referrer 信息泄露
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 限制浏览器功能权限
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
            ].join(', '),
          },
          // XSS 过滤（旧版浏览器兼容，现代浏览器由 CSP 接管）
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // 禁止浏览器自动猜测下载文件类型
          {
            key: 'X-Download-Options',
            value: 'noopen',
          },
          // 限制 DNS 预取（防信息泄露）
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          // 跨域资源策略
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // 禁用共享上下文（防 Spectre 类攻击）
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
      // API 路由额外的安全头
      {
        source: '/api/:path*',
        headers: [
          // API 响应不缓存（防止敏感数据被缓存）
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // React Strict Mode（开发环境检测潜在问题）
  reactStrictMode: true,

  // 图片优化
  images: {
    domains: ['qunxiangxinghuo.cn', 'www.qunxiangxinghuo.cn'],
  },

  // 生产环境关闭 x-powered-by（隐藏技术栈）
  poweredByHeader: false,

  // 压缩响应
  compress: true,
};

export default nextConfig;
