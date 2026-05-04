'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MobileContainer from './MobileContainer';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  // 全局认证守卫：未登录用户访问非公开页面 → 重定向到登录页
  useEffect(() => {
    if (status === 'unauthenticated' && pathname && pathname !== '/') {
      router.replace('/');
    }
  }, [status, pathname, router]);

  // pathname 未就绪时：显示基本布局（无导航栏，避免闪烁）
  if (!pathname) {
    return (
      <div className="h-full w-full max-w-md sm:max-w-lg mx-auto bg-xh-primary relative overflow-hidden flex flex-col">
        <MobileContainer className="flex-1 min-h-0 overflow-hidden">
          {children}
        </MobileContainer>
      </div>
    );
  }

  const isLoginPage = pathname === '/';

  return (
    <div className="h-full w-full max-w-md sm:max-w-lg mx-auto bg-xh-primary relative overflow-hidden flex flex-col">
      <MobileContainer className="flex-1 min-h-0 overflow-hidden">
        {children}
      </MobileContainer>
      {/* 登录页绝对不渲染底部导航栏 */}
      {!isLoginPage && <BottomNav />}
    </div>
  );
}
