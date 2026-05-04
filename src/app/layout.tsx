import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: '群像·星火',
  description: '每一个认真生活的人，都能成为故事的一部分',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
