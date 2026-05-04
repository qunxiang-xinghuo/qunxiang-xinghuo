'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import MobileContainer from './MobileContainer';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // 客户端挂载后检查登录状态（避免useSession导致hydration问题）
  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem('xh_user');
    if (!raw && pathname && pathname !== '/') {
      router.replace('/');
    }
  }, [pathname, router]);

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
