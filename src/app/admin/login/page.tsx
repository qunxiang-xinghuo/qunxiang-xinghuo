'use client';

import { Suspense } from 'react';
import AdminLoginForm from './AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full page-gradient">
      <div className="w-8 h-8 border-2 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
    </div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
