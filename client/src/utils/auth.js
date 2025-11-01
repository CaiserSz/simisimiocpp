/**
 * Authentication utility functions for token management
 */

// Token storage keys
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Save token to local storage
 * @param {string} token - JWT token
 */
export const saveToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Get token from local storage
 * @returns {string|null} JWT token or null if not found
 */
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Remove token from local storage
 */
export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Save user data to local storage
 * @param {object} user - User data
 */
export const saveUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Get user data from local storage
 * @returns {object|null} User data or null if not found
 */
export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
};

/**
 * Remove user data from local storage
 */
export const clearUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean} True if user has the role
 */
export const hasRole = (role) => {
  const user = getUser();
  return user && (user.role === role || user.role === 'admin');
};

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has the permission
 */
export const hasPermission = (permission) => {
  const user = getUser();
  return user && (user.role === 'admin' || (user.permissions && user.permissions.includes(permission)));
};

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has any of the permissions
 */
export const hasAnyPermission = (permissions) => {
  const user = getUser();
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.some(permission => 
    user.permissions && user.permissions.includes(permission)
  );
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  clearToken();
  clearUser();
};

/**
 * Get authorization header for API requests
 * @returns {object} Authorization header
 */
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Parse JWT token
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token or null if invalid
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

/**
 * Get token expiration date
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null if invalid token
 */
export const getTokenExpiration = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
};

/**
 * Get time remaining until token expires (in milliseconds)
 * @param {string} token - JWT token
 * @returns {number} Time remaining in milliseconds (0 if expired)
 */
export const getTokenTimeRemaining = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;
  return Math.max(0, expiration.getTime() - Date.now());
};

export default {
  saveToken,
  getToken,
  clearToken,
  saveUser,
  getUser,
  clearUser,
  isAuthenticated,
  hasRole,
  hasPermission,
  hasAnyPermission,
  clearAuth,
  getAuthHeader,
  parseJwt,
  isTokenExpired,
  getTokenExpiration,
  getTokenTimeRemaining,
};
