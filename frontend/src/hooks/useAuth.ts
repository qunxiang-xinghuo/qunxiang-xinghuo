'use client';

import { useState, useEffect } from 'react';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('xh_user');
    const savedIdentity = localStorage.getItem('xh_identity');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (savedIdentity) {
      // Create temporary user from saved identity
      const identity = JSON.parse(savedIdentity);
      setUser({
        id: 'temp-' + Date.now(),
        name: identity.label,
        identity,
        level: 1,
        sparkCount: 0,
      });
    }
    setLoading(false);
  }, []);

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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('xh_user');
    localStorage.removeItem('xh_identity');
  };

  return {
    user,
    loading,
    saveIdentity,
    logout,
  };
}
