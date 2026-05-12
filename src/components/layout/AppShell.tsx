'use client';

import { ReactNode, Component, ErrorInfo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MobileContainer from './MobileContainer';
import BottomNav from './BottomNav';

interface EBProps { children: ReactNode; }
interface EBState { hasError: boolean; error?: Error; }
class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <p className="text-lg text-white/40 mb-2">出错了</p>
          <p className="text-xs text-white/20 mb-4">页面遇到了一点问题，请刷新重试</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-[#8a9ab0]/15 text-[#8a9ab0] text-sm border border-[#8a9ab0]/25"
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AppShellProps {
  children: ReactNode;
}

function BlankScreen() {
  return (
    <div className="h-full w-full max-w-md sm:max-w-lg mx-auto bg-xh-primary relative overflow-hidden" />
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();

  if (!pathname) {
    return <BlankScreen />;
  }

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/admin/login';

  if (sessionStatus === 'loading' && !isPublicPage) {
    return <BlankScreen />;
  }

  if (sessionStatus === 'unauthenticated' && !isPublicPage) {
    return <BlankScreen />;
  }

  const isLoginPage = pathname === '/' || pathname === '/login' || pathname === '/admin/login';

  return (
    <div className="h-full w-full max-w-md sm:max-w-lg mx-auto bg-xh-primary relative overflow-hidden flex flex-col">
      <MobileContainer className="flex-1 min-h-0 overflow-hidden">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </MobileContainer>
      {!isLoginPage && <BottomNav />}
    </div>
  );
}
