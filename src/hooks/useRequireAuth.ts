'use client';

import { useSession } from 'next-auth/react';

export function useRequireAuth() {
  const { status } = useSession();

  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
  };
}
