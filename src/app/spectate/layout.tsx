// v7.0-fix7: 强制 spectate 页面动态渲染，确保中间件在请求时执行
export const dynamic = 'force-dynamic';

export default function SpectateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
