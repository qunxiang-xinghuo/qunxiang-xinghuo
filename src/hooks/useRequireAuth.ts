'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// v8.0: 统一认证门禁 hook
// 在任何受保护页面顶部调用，未登录时立即跳转到 /login
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('[useRequireAuth] 未登录，强制跳转到 /login');
      // 清除所有本地认证数据
      localStorage.removeItem('xh_user');
      localStorage.removeItem('xh_identity');
      localStorage.removeItem('xh_user_id');
      sessionStorage.clear();
      router.replace('/login');
    }
  }, [status, router]);

  // 返回认证状态，页面可以根据此状态决定是否渲染内容
  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
  };
}
