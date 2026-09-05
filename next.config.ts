/**
 * Next.js 配置
 * 包含 HTTPS 重定向、www 域名统一与安全响应头配置
 *
 * @security 安全头说明：
 * - Strict-Transport-Security: 强制 HTTPS（HSTS，2 年 + 预加载）
 * - Content-Security-Policy: 内容安全策略，防 XSS/数据注入
 * - X-Frame-Options: 禁止被 iframe 嵌套（点击劫持防护）
 * - X-Content-Type-Options: 禁止 MIME 类型嗅探
 * - Cross-Origin-Opener-Policy: 跨源窗口隔离
 * - Cross-Origin-Resource-Policy: 跨源资源加载限制
 * - Referrer-Policy: 控制 Referer 泄露
 * - Permissions-Policy: 禁用不需要的浏览器能力
 * poweredByHeader:false 隐藏 X-Powered-By（避免暴露技术栈）
 */

import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/**
 * 内容安全策略（CSP）
 * - default-src 'self': 默认只允许同源
 * - script: 同源 + inline（Next.js 运行时需要内联脚本）
 * - style: 同源 + inline + Google Fonts（Tailwind/Next 注入内联样式）
 * - font: 同源 + Google Fonts 字体 CDN（大陆使用 .cn 域）
 * - img: 同源 + data: 内联图
 * - connect: 同源（SSE/API）+ data:
 * - frame-ancestors 'none': 等价于 X-Frame-Options: DENY
 * 注：dev 环境放开 eval/unsafe-eval 以支持 HMR
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.cn https://fonts.gstatic.cn",
  "font-src 'self' data: https://fonts.gstatic.cn",
  "img-src 'self' data: blob:",
  "connect-src 'self' data: blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  // 隐藏 X-Powered-By 响应头（不暴露 Next.js 技术栈）
  poweredByHeader: false,

  // 启用 HTTPS 重定向 + www 域名统一（生产环境）
  async redirects() {
    if (isProd) {
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

  // 安全响应头配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 强制 HTTPS：2 年 + 子域名 + 预加载
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // 内容安全策略（防 XSS 与代码注入）
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          // 禁止被 iframe 嵌套（点击劫持防护）
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // 禁止 MIME 类型嗅探
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 跨源窗口隔离（防止跨站 tab 间数据泄露）
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // 限制跨源资源加载
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // Referer 仅在同源下完整发送，跨源只发 origin
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 禁用不需要的浏览器能力
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          // 传统浏览器 XSS 过滤（现代浏览器由 CSP 接管，保留作兜底）
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
