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

// v8.0-login-fix: 空白占位屏（无任何内容）
function BlankScreen() {
  return (
    <div className="h-full w-full max-w-md sm:max-w-lg mx-auto bg-xh-primary relative overflow-hidden" />
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [mounted, setMounted] = useState(false);

  // 客户端挂载后检查登录状态
  useEffect(() => {
    setMounted(true);
  }, []);

  // v8.0-login-fix: 严格认证守卫
  useEffect(() => {
    if (!pathname) return;

    const isPublicPage = PUBLIC_PAGES.includes(pathname);

    // 情况1：已登录用户访问登录页/注册页 → 重定向到首页
    if (sessionStatus === 'authenticated' && isPublicPage) {
      console.log('[AppShell] 已登录用户访问公开页', pathname, '→ /home');
      router.replace('/home');
      return;
    }

    // 情况2：session 明确未认证
    if (sessionStatus === 'unauthenticated') {
      // v8.0: 无条件清除所有本地残留数据，防止任何形式的残留
      console.log('[AppShell] Session 未认证，清除所有本地残留数据');
      localStorage.removeItem('xh_user');
      localStorage.removeItem('xh_identity');
      localStorage.removeItem('xh_user_id');
      sessionStorage.clear();

      // 未登录用户访问非公开页面 → 重定向到登录页
      if (!isPublicPage) {
        console.log('[AppShell] 未登录用户访问', pathname, '→ /login');
        router.replace('/login');
        return;
      }
    }
  }, [pathname, router, sessionStatus]);

  // pathname 未就绪时：显示空白屏（不渲染任何内容，防止任何闪烁）
  if (!pathname) {
    return <BlankScreen />;
  }

  const isPublicPage = PUBLIC_PAGES.includes(pathname);

  // v8.0-login-fix: 渲染级门禁守卫 — 在组件层面阻止未认证内容渲染
  // 1. session 加载中 + 非公开页面 → 显示空白屏（不渲染 children，不渲染 BottomNav）
  if (sessionStatus === 'loading' && !isPublicPage) {
    return <BlankScreen />;
  }

  // 2. session 已确认未登录 + 非公开页面 → 显示空白屏（等待跳转完成）
  if (sessionStatus === 'unauthenticated' && !isPublicPage) {
    return <BlankScreen />;
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
