import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';

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
          <div className="h-full w-full max-w-md mx-auto bg-xh-primary relative overflow-hidden flex flex-col">
            <MobileContainer className="flex-1 min-h-0 overflow-hidden">
              {children}
            </MobileContainer>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
