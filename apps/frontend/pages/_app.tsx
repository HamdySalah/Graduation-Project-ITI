import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  // Use client-side rendering for auth to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <>
      {isClient ? (
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      ) : (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
    </>
  );
}

export default MyApp;