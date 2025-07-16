import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import ChatWidget with dynamic loading (no SSR) to avoid hydration issues
const ChatWidget = dynamic(() => import('../components/ChatWidget'), { 
  ssr: false 
});

function MyApp({ Component, pageProps }: AppProps) {
  // Global error handling
  useEffect(() => {
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

  return (
    <AuthProvider>
      <Component {...pageProps} />
      {/* AI Chat Widget - appears on all pages */}
      {typeof window !== 'undefined' && <ChatWidget />}
    </AuthProvider>
  );
}

export default MyApp;