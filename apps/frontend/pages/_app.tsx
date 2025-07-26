import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Import Navbar with dynamic loading to avoid hydration issues
const Navbar = dynamic(() => import('../components/Navbar'), { 
  ssr: false 
});

// Import ChatWidget with dynamic loading (no SSR) to avoid hydration issues
const ChatWidget = dynamic(() => import('../components/ChatWidget'), { 
  ssr: false 
});

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize router
  const router = useRouter();
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register';
  const isAdminPage = router.pathname.startsWith('/admin');
  const [mounted, setMounted] = useState(false);
  
  // Wait until after client-side hydration to show components
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Global error handling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent the default behavior (which would log to console)
      event.preventDefault();
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Prevent hydration errors by waiting for client side rendering
  const content = mounted ? (
    <div className="flex flex-col min-h-screen">
      {/* Navbar appears on all pages except login, register, and admin pages */}
      {!isAuthPage && !isAdminPage && <Navbar />}
      <main className={`flex-grow ${!isAuthPage && !isAdminPage ? 'pt-0' : ''}`}>
        <Component {...pageProps} />
      </main>
      {/* AI Chat Widget - appears on all pages */}
      <ChatWidget />
    </div>
  ) : (
    // Simple placeholder during SSR to avoid hydration issues
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Component {...pageProps} />
      </main>
    </div>
  );

  return (
    <AuthProvider>
      {content}
    </AuthProvider>
  );
}

export default MyApp;