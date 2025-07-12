import { useRouter } from 'next/router';
import { useCallback } from 'react';

/**
 * Custom navigation hook that handles Next.js 15 + React 19 compatibility issues
 * 
 * This hook provides a reliable navigation method that works around known issues
 * with client-side routing in Next.js 15 when used with React 19.
 * 
 * The issue: router.push() may not properly trigger page re-renders in some cases,
 * causing the URL to change but the page content to remain the same.
 * 
 * The solution: Use window.location.href as the primary navigation method for now,
 * with an option to fall back to router.push() in the future when compatibility improves.
 */
export function useNavigation() {
  const router = useRouter();

  const navigate = useCallback(async (url: string, options?: {
    method?: 'router' | 'window' | 'auto';
    replace?: boolean;
    shallow?: boolean;
  }) => {
    const { method = 'auto', replace = false, shallow = false } = options || {};
    
    console.log(`Navigation: Attempting to navigate to ${url} using method: ${method}`);
    
    try {
      if (method === 'window' || method === 'auto') {
        // Use window.location for reliable navigation
        console.log(`Navigation: Using window.location for ${url}`);
        
        if (replace) {
          window.location.replace(url);
        } else {
          window.location.href = url;
        }
        return true;
      }
      
      if (method === 'router') {
        // Use Next.js router (may have issues with Next.js 15 + React 19)
        console.log(`Navigation: Using router.push for ${url}`);
        
        if (replace) {
          await router.replace(url, undefined, { shallow });
        } else {
          await router.push(url, undefined, { shallow });
        }
        
        console.log(`Navigation: Router navigation to ${url} completed`);
        return true;
      }
      
    } catch (error) {
      console.error(`Navigation: Error navigating to ${url}:`, error);
      
      // Fallback to window.location if router fails
      console.log(`Navigation: Falling back to window.location for ${url}`);
      if (replace) {
        window.location.replace(url);
      } else {
        window.location.href = url;
      }
      return false;
    }
    
    return false;
  }, [router]);

  const goBack = useCallback(() => {
    console.log('Navigation: Going back');
    try {
      router.back();
    } catch (error) {
      console.error('Navigation: Error going back:', error);
      window.history.back();
    }
  }, [router]);

  const goForward = useCallback(() => {
    console.log('Navigation: Going forward');
    try {
      router.forward();
    } catch (error) {
      console.error('Navigation: Error going forward:', error);
      window.history.forward();
    }
  }, [router]);

  const reload = useCallback(() => {
    console.log('Navigation: Reloading page');
    window.location.reload();
  }, []);

  return {
    navigate,
    goBack,
    goForward,
    reload,
    // Expose router for advanced use cases
    router,
    // Current route information
    pathname: router.pathname,
    asPath: router.asPath,
    query: router.query,
    isReady: router.isReady
  };
}

/**
 * Navigation utilities for common use cases
 */
export const navigationUtils = {
  /**
   * Navigate to a specific page with error handling
   */
  async navigateTo(url: string, options?: { replace?: boolean }) {
    const { replace = false } = options || {};
    
    try {
      console.log(`NavigationUtils: Navigating to ${url}`);
      
      if (replace) {
        window.location.replace(url);
      } else {
        window.location.href = url;
      }
      
      return true;
    } catch (error) {
      console.error(`NavigationUtils: Error navigating to ${url}:`, error);
      return false;
    }
  },

  /**
   * Navigate to dashboard
   */
  async goToDashboard() {
    return this.navigateTo('/dashboard');
  },

  /**
   * Navigate to profile
   */
  async goToProfile() {
    return this.navigateTo('/profile');
  },

  /**
   * Navigate to home
   */
  async goToHome() {
    return this.navigateTo('/');
  },

  /**
   * Navigate to login
   */
  async goToLogin() {
    return this.navigateTo('/login');
  },

  /**
   * Navigate to a specific request
   */
  async goToRequest(requestId: string) {
    return this.navigateTo(`/requests/${requestId}`);
  },

  /**
   * Navigate to create request
   */
  async goToCreateRequest() {
    return this.navigateTo('/requests/create');
  },

  /**
   * Navigate to nurses list
   */
  async goToNurses() {
    return this.navigateTo('/nurses');
  },

  /**
   * Check if we're on a specific page
   */
  isOnPage(pathname: string): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === pathname;
  },

  /**
   * Get current pathname
   */
  getCurrentPath(): string {
    if (typeof window === 'undefined') return '';
    return window.location.pathname;
  },

  /**
   * Refresh the current page
   */
  refresh() {
    window.location.reload();
  }
};

/**
 * Hook for dropdown navigation (commonly used in headers)
 */
export function useDropdownNavigation() {
  const { navigate } = useNavigation();

  const navigateAndClose = useCallback(async (url: string, closeDropdown: () => void) => {
    console.log(`DropdownNavigation: Navigating to ${url} and closing dropdown`);
    closeDropdown();
    
    // Small delay to ensure dropdown closes before navigation
    setTimeout(() => {
      navigate(url);
    }, 50);
  }, [navigate]);

  return {
    navigateAndClose
  };
}

export default useNavigation;
