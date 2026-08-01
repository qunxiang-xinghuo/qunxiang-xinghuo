/**
 * @file 全局布局组件
 * @description 定义网站整体布局结构，包括 Header、Footer、字体加载、SEO 元信息
 * 所有页面共享此布局，提供统一的视觉框架和导航体验
 */

import type { Metadata, Viewport } from 'next';
import { Noto_Serif_SC, Noto_Sans_SC } from 'next/font/google';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Providers } from '@/components/providers/session-provider';

const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-serif',
  display: 'swap',
});

const notoSans = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: '群像·星火 — 创作工坊',
    template: '%s | 群像·星火',
  },
  description:
    '给两个陌生人一个场景，让他们在对话中，把彼此变成故事里的角色。群像·星火创作工坊。',
  keywords: ['群像星火', '角色扮演', '创作工坊', '心理剧', '即兴对话', '故事创作'],
  authors: [{ name: '群像·星火', url: 'https://qunxiangxinghuo.cn' }],
  openGraph: {
    title: '群像·星火 — 创作工坊',
    description:
      '给两个陌生人一个场景，让他们在对话中，把彼此变成故事里的角色。',
    url: 'https://qunxiangxinghuo.cn',
    siteName: '群像·星火',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body
        className={`${notoSerif.variable} ${notoSans.variable} ${notoSans.className} antialiased`}
      >
        <Providers>
          {isDev && <Inspector />}
          <SiteHeader />
          <main className="min-h-screen">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
