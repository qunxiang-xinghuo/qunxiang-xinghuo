'use client';

import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function RootLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full bg-[#1a1a2e] items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
