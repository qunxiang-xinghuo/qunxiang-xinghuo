import { Suspense } from 'react';
import LoginForm from '../LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <div className="w-8 h-8 border-2 border-[#D4B830]/30 border-t-[#D4B830] rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/30">加载中...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
