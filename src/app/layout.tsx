import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  title: {
    default: '群像·星火 — 创作工坊',
    template: '%s — 群像·星火',
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
      <body className="antialiased">
        {isDev && <Inspector />}
        <SiteHeader />
        <main className="min-h-screen">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
