// Authentication API Service

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Production: use Render backend
  if (hostname === 'realestate3d-demo.com' || hostname.includes('workers.dev')) {
    return 'https://realestate3d-backend.onrender.com/api';
  }
  
  // Development: use localhost or local network IP
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Log which API we're using
console.log('🔐 Auth API URL:', API_BASE_URL);

/**
 * Handle API responses
 */
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  return data;
};

/**
 * Authentication API methods
 */
export const authAPI = {
  /**
   * Register a new user
   */
  register: async ({ email, password, name }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },

  /**
   * Login existing user
   */
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  /**
   * Verify authentication token
   */
  verifyToken: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await handleResponse(response);
      return data.valid;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, updates, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  /**
   * Get user profile
   */
  getProfile: async (userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
};

/**
 * Helper function to get current auth token
 */
export const getAuthToken = () => {
  const sessionData = window.storage.get('authSession');
  return sessionData?.token || null;
};

/**
 * Helper function to get current user
 */
export const getCurrentUser = () => {
  const sessionData = window.storage.get('authSession');
  return sessionData?.user || null;
};

/**
 * Add auth header to API requests
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};
