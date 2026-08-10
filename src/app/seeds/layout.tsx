import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '故事种子墙',
  description: '创作灵感的火花，等待被培育成完整故事',
};

export default function SeedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
