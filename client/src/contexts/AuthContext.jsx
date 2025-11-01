import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

// Create the authentication context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  register: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: () => {},
  hasRole: () => {},
  hasPermission: () => {},
});

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  const navigate = useNavigate();
  const location = useLocation();

  // Set the auth token in axios headers and verify the token
  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
    setToken(token);
  };

  // Load user from token on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (token) {
          setAuthToken(token);
          const { data } = await api.get('/api/auth/me');
          setUser(data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading user', error);
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Redirect after login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  // Login function
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setAuthToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return data.user;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      throw new Error(message);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const { data } = await api.post('/api/auth/register', userData);
      setAuthToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      return data.user;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      throw new Error(message);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
      toast.info('You have been logged out.');
    }
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data);
      return data;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role || user.role === 'admin';
  };

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.some(permission => 
      user.permissions?.includes(permission)
    );
  };

  // The context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    hasRole,
    hasPermission,
    hasAnyPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
