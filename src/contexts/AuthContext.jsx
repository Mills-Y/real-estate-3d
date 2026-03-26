import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const sessionData = window.storage.get('authSession');
      
      if (sessionData && sessionData.token) {
        // Verify token is still valid
        const isValid = await authAPI.verifyToken(sessionData.token);
        
        if (isValid) {
          setUser(sessionData.user);
        } else {
          // Token expired, clear session
          logout();
        }
      }
    } catch (err) {
      console.error('Auth status check failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        const sessionData = {
          user: response.user,
          token: response.token,
          expiresAt: response.expiresAt
        };

        // Store session
        window.storage.set('authSession', sessionData);
        setUser(response.user);

        console.log('✅ Login successful:', response.user.email);
        return { success: true };
      } else {
        setError(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.register({ email, password, name });
      
      if (response.success) {
        const sessionData = {
          user: response.user,
          token: response.token,
          expiresAt: response.expiresAt
        };

        // Store session
        window.storage.set('authSession', sessionData);
        setUser(response.user);

        console.log('✅ Registration successful:', response.user.email);
        return { success: true };
      } else {
        setError(response.error || 'Registration failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    window.storage.delete('authSession');
    setUser(null);
    setError(null);
    console.log('👋 User logged out');
  };

  const updateUser = (updates) => {
    const sessionData = window.storage.get('authSession');
    if (sessionData) {
      const updatedUser = { ...sessionData.user, ...updates };
      sessionData.user = updatedUser;
      window.storage.set('authSession', sessionData);
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
