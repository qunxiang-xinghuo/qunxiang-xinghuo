'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  identity: {
    type: 'real' | 'recommended' | 'custom';
    label: string;
  };
  level: number;
  sparkCount: number;
}

export function useAuth() {
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // v6.3-auth-fix3: session 明确为未认证时，无条件清除本地残留数据
    if (sessionStatus === 'unauthenticated') {
      const savedUser = localStorage.getItem('xh_user');
      const savedUserId = localStorage.getItem('xh_user_id');
      const savedIdentity = localStorage.getItem('xh_identity');

      if (savedUser || savedUserId || savedIdentity) {
        console.log('[useAuth] Session 已失效，清除所有本地残留用户数据');
        localStorage.removeItem('xh_user');
        localStorage.removeItem('xh_identity');
        localStorage.removeItem('xh_user_id');
      }
      setUser(null);
      setLoading(false);
      return;
    }

    // 1. 优先从 NextAuth session 读取（最可信）
    if (sessionStatus === 'authenticated' && session?.user) {
      const authUser: User = {
        id: session.user.id || 'user-' + Date.now(),
        name: session.user.name || session.user.username || '用户',
        avatar: session.user.image || undefined,
        identity: {
          type: 'real',
          label: session.user.username || session.user.name || '用户',
        },
        level: session.user.level || 1,
        sparkCount: session.user.sparkCount || 0,
      };
      setUser(authUser);
      localStorage.setItem('xh_user', JSON.stringify(authUser));
      setLoading(false);
      return;
    }

    // 2. session 还在加载中，用 localStorage 做临时兜底
    if (sessionStatus === 'loading') {
      const savedUser = localStorage.getItem('xh_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('xh_user');
        }
      }
    }

    // 3. 最后从 identity 创建临时用户（仅用于匿名模式）
    const savedIdentity = localStorage.getItem('xh_identity');
    if (savedIdentity) {
      try {
        const identity = JSON.parse(savedIdentity);
        const tempUser: User = {
          id: 'temp-' + Date.now(),
          name: identity.label,
          identity,
          level: 1,
          sparkCount: 0,
        };
        setUser(tempUser);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('xh_identity');
      }
    }

    setLoading(false);
  }, [session, sessionStatus]);

  const saveIdentity = (identity: User['identity']) => {
    const newUser: User = {
      id: user?.id || 'temp-' + Date.now(),
      name: identity.label,
      identity,
      level: user?.level || 1,
      sparkCount: user?.sparkCount || 0,
    };
    setUser(newUser);
    localStorage.setItem('xh_user', JSON.stringify(newUser));
    localStorage.setItem('xh_identity', JSON.stringify(identity));
  };

  const login = async (email: string, _password: string) => {
    const identity = user?.identity || { type: 'real' as const, label: email.split('@')[0] };
    const newUser: User = {
      id: user?.id || 'user-' + Date.now(),
      name: email.split('@')[0],
      avatar: undefined,
      identity,
      level: user?.level || 1,
      sparkCount: user?.sparkCount || 0,
    };
    setUser(newUser);
    localStorage.setItem('xh_user', JSON.stringify(newUser));
  };

  const register = async (email: string, _password: string, name?: string) => {
    const identity = { type: 'real' as const, label: name || email.split('@')[0] };
    const newUser: User = {
      id: 'user-' + Date.now(),
      name: name || email.split('@')[0],
      avatar: undefined,
      identity,
      level: 1,
      sparkCount: 0,
    };
    setUser(newUser);
    localStorage.setItem('xh_user', JSON.stringify(newUser));
  };

  const updateIdentity = (identity: User['identity']) => {
    const updatedUser: User = {
      id: user?.id || 'temp-' + Date.now(),
      name: user?.name || identity.label,
      avatar: user?.avatar,
      identity,
      level: user?.level || 1,
      sparkCount: user?.sparkCount || 0,
    };
    setUser(updatedUser);
    localStorage.setItem('xh_user', JSON.stringify(updatedUser));
    localStorage.setItem('xh_identity', JSON.stringify(identity));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('xh_user');
    localStorage.removeItem('xh_identity');
    localStorage.removeItem('xh_user_id');
  };

  return {
    user,
    loading,
    saveIdentity,
    login,
    register,
    updateIdentity,
    logout,
  };
}
