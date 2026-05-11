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
    if (sessionStatus === 'unauthenticated') {
      setUser(null);
      setLoading(false);
      return;
    }

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
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [session, sessionStatus]);

  const updateIdentity = (identity: User['identity']) => {
    if (!user) return;
    setUser({ ...user, identity });
  };

  return {
    user,
    loading,
    updateIdentity,
  };
}
