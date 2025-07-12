// Session management utilities

export class SessionManager {
  private static instance: SessionManager;
  private activityTimeout: NodeJS.Timeout | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Initialize session management
  init() {
    this.setupActivityTracking();
    this.setupSessionCheck();
  }

  // Setup activity tracking
  private setupActivityTracking() {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      const now = Date.now();
      localStorage.setItem('last_activity', now.toString());
      
      // Clear existing timeout
      if (this.activityTimeout) {
        clearTimeout(this.activityTimeout);
      }
      
      // Set new timeout for inactivity warning
      this.activityTimeout = setTimeout(() => {
        this.showInactivityWarning();
      }, 40 * 60 * 1000); // 40 minutes
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Initial activity update
    updateActivity();
  }

  // Setup periodic session check
  private setupSessionCheck() {
    this.sessionCheckInterval = setInterval(() => {
      this.checkSession();
    }, 10 * 60 * 1000); // Check every 10 minutes (less aggressive)
  }

  // Check session validity
  private checkSession() {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('token_expiration');
    const lastActivity = localStorage.getItem('last_activity');

    if (!token || !tokenExpiration) {
      return;
    }

    const now = Date.now();
    const expTime = parseInt(tokenExpiration);
    const lastActTime = parseInt(lastActivity || '0');

    // Check if token is expired (with 5 minute buffer)
    if (now >= (expTime + 5 * 60 * 1000)) {
      console.log('Token expired beyond buffer, logging out');
      this.logout();
      return;
    }

    // Check for inactivity (45 minutes instead of 30)
    const inactiveTime = now - lastActTime;
    const maxInactiveTime = 45 * 60 * 1000; // 45 minutes

    if (inactiveTime > maxInactiveTime) {
      console.log('User inactive for too long, logging out');
      this.logout();
      return;
    }

    // Warn if token expires in 10 minutes (instead of 5)
    const timeUntilExpiration = expTime - now;
    if (timeUntilExpiration <= 10 * 60 * 1000 && timeUntilExpiration > 0) {
      this.showExpirationWarning(Math.floor(timeUntilExpiration / 60000));
    }
  }

  // Show inactivity warning
  private showInactivityWarning() {
    // Instead of showing a confirm dialog which blocks UI,
    // just log a warning and update the activity time
    console.warn('User has been inactive for a while, extending session');

    // Automatically extend the session
    localStorage.setItem('last_activity', Date.now().toString());

    // You could show a non-blocking toast notification here instead
    // For now, we'll just silently extend the session
  }

  // Show token expiration warning
  private showExpirationWarning(minutesRemaining: number) {
    console.warn(`Session will expire in ${minutesRemaining} minutes`);
    
    // You could show a toast notification here instead of alert
    if (minutesRemaining <= 2) {
      const shouldRefresh = confirm(
        `Your session will expire in ${minutesRemaining} minutes. Click OK to refresh your session.`
      );

      if (shouldRefresh) {
        // Attempt to refresh the session by making an API call
        this.refreshSession();
      }
    }
  }

  // Refresh session by making an API call
  private async refreshSession() {
    try {
      // Make a simple API call to refresh the session
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Session refreshed successfully');
        // Update last activity
        localStorage.setItem('last_activity', Date.now().toString());
      } else {
        console.log('Session refresh failed, logging out');
        this.logout();
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      this.logout();
    }
  }

  // Logout user
  private logout() {
    console.log('Session manager initiating logout');

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expiration');
      localStorage.removeItem('last_activity');
      localStorage.removeItem('bypass_auth');

      // Use a more gentle redirect approach
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 1000); // 1 second delay
    } catch (error) {
      console.error('Error during session manager logout:', error);
    }
  }

  // Cleanup
  cleanup() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }

  // Get session info
  getSessionInfo() {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('token_expiration');
    const lastActivity = localStorage.getItem('last_activity');

    if (!token || !tokenExpiration) {
      return null;
    }

    return {
      hasToken: !!token,
      expiresAt: new Date(parseInt(tokenExpiration)),
      lastActivity: lastActivity ? new Date(parseInt(lastActivity)) : null,
      timeUntilExpiration: parseInt(tokenExpiration) - Date.now(),
      isExpired: Date.now() >= parseInt(tokenExpiration)
    };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
