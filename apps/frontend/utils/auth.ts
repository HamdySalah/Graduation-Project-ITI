// Token handling utilities

/**
 * Gets the JWT token from local storage
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Sets the JWT token in local storage
 */
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

/**
 * Removes the JWT token from local storage
 */
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

/**
 * Gets the user from local storage
 */
export const getUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

/**
 * Sets the user in local storage
 */
export const setUser = (user: any): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Removes the user from local storage
 */
export const removeUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

/**
 * Checks if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Checks if the user has a specific role
 */
export const hasRole = (role: string): boolean => {
  const user = getUser();
  return user ? user.role === role : false;
};
