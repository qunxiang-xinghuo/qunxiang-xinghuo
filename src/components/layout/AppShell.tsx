'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MobileContainer from './MobileContainer';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

// 公开页面：不需要登录即可访问
const PUBLIC_PAGES = ['/', '/login', '/register'];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [mounted, setMounted] = useState(false);

  // 客户端挂载后检查登录状态
  useEffect(() => {
    setMounted(true);
  }, []);

  // v6.3-auth-fix3: 严格认证守卫
  useEffect(() => {
    if (!pathname) return;

    const isPublicPage = PUBLIC_PAGES.includes(pathname);
    const localUser = localStorage.getItem('xh_user');
    const localUserId = localStorage.getItem('xh_user_id');

    // 情况1：已登录用户访问登录页/注册页 → 重定向到首页
    if (sessionStatus === 'authenticated' && isPublicPage) {
      console.log('[AppShell] 已登录用户访问公开页', pathname, '→ /home');
      router.replace('/home');
      return;
    }

    // 情况2：session 明确未认证
    if (sessionStatus === 'unauthenticated') {
      // v7.0-fix5: 无条件清除所有本地残留数据，防止任何形式的残留
      console.log('[AppShell] Session 未认证，清除所有本地残留数据');
      localStorage.removeItem('xh_user');
      localStorage.removeItem('xh_identity');
      localStorage.removeItem('xh_user_id');

      // 未登录用户访问非公开页面 → 重定向到登录页
      if (!isPublicPage) {
        console.log('[AppShell] 未登录用户访问', pathname, '→ /login');
        router.replace('/login');
        return;
      }
    }

    // 情况3：session 还在加载中
    if (sessionStatus === 'loading') {
      // 既不确认登录也不确认未登录，等待 session 加载完成
      // 如果是非公开页面且 localStorage 也没有用户数据，暂时显示 loading
      if (!isPublicPage && !localUser) {
        // 等待 session 加载完成后再判断
        return;
      }
    }
  }, [pathname, router, sessionStatus]);

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

  const isLoginPage = pathname === '/' || pathname === '/login';

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
