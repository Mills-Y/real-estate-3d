/**
 * API Service for Real Estate 3D Scanner
 * Handles all communication with the backend server
 * Dynamically switches between localhost (dev) and Render (production)
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Production: use Render backend
  if (hostname === 'realestate3d-demo.com' || hostname.includes('workers.dev') || hostname.includes('pages.dev')) {
    return 'https://realestate3d-backend.onrender.com/api';
  }
  
  // Development: use localhost or local network IP
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Log which API we're using
console.log('🔗 API URL:', API_BASE_URL);

/**
 * Get auth token from storage
 */
const getAuthToken = () => {
  try {
    const sessionData = window.storage?.get('authSession');
    return sessionData?.token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get the full URL for a model file
 * @param {string} modelPath - The path to the model (e.g., /uploads/models/file.glb)
 * @returns {string} Full URL to the model
 */
export const getModelURL = (modelPath) => {
  if (!modelPath) return null;
  
  // If it's already a full URL, return as-is
  if (modelPath.startsWith('http://') || modelPath.startsWith('https://')) {
    return modelPath;
  }
  
  // Production: use Render backend
  const hostname = window.location.hostname;
  if (hostname === 'realestate3d-demo.com' || hostname.includes('workers.dev') || hostname.includes('pages.dev')) {
    return `https://realestate3d-backend.onrender.com${modelPath}`;
  }
  
  // Development: use current hostname
  return `http://${hostname}:5000${modelPath}`;
};

/**
 * Upload a 3D model to the server
 * @param {FormData} formData - Form data containing the file and metadata
 * @returns {Promise<Object>} Upload result
 */
export const uploadModel = async (formData) => {
  try {
    const token = getAuthToken();
    const headers = {};
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const uploadUrl = `${API_BASE_URL}/upload`;
    console.log('📤 ========== UPLOAD DEBUG ==========');
    console.log('📤 API_BASE_URL:', API_BASE_URL);
    console.log('📤 Full upload URL:', uploadUrl);
    console.log('📤 Auth token present:', !!token);
    console.log('📤 FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`📤   ${key}:`, typeof value === 'object' ? value.name || value : value);
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: headers,
      body: formData,
      credentials: 'include',
    });

    console.log('📤 Response status:', response.status);
    console.log('📤 Response URL:', response.url);

    const data = await response.json();
    
    console.log('📤 Response data:', data);
    console.log('📤 ========== END UPLOAD DEBUG ==========');

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload model',
    };
  }
};

/**
 * Get all models from the server
 * @param {Object} options - Query options
 * @returns {Promise<Object>} List of models
 */
export const getModels = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (options.page) queryParams.append('page', options.page);
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.sort) queryParams.append('sort', options.sort);
    if (options.type) queryParams.append('type', options.type);
    if (options.visibility) queryParams.append('visibility', options.visibility);

    const url = `${API_BASE_URL}/models${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers: headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch models');
    }

    return data;
  } catch (error) {
    console.error('Fetch models error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch models',
      data: [],
    };
  }
};

// Alias for getModels (for backward compatibility)
export const fetchModels = getModels;

/**
 * Get models belonging to the current user
 * @param {Object} options - Query options
 * @returns {Promise<Object>} List of user's models
 */
export const fetchMyModels = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (options.page) queryParams.append('page', options.page);
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.sort) queryParams.append('sort', options.sort);
    if (options.type) queryParams.append('type', options.type);

    const url = `${API_BASE_URL}/models/mine${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('📥 Fetching my models from:', url);
    console.log('📥 Auth token present:', !!token);

    const response = await fetch(url, {
      headers: headers,
      credentials: 'include',
    });

    const data = await response.json();

    console.log('📥 My models response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch my models');
    }

    return data;
  } catch (error) {
    console.error('Fetch my models error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch my models',
      data: [],
    };
  }
};

/**
 * Get a single model by ID
 * @param {string} id - Model ID
 * @returns {Promise<Object>} Model data
 */
export const getModelById = async (id) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      headers: headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch model');
    }

    return data;
  } catch (error) {
    console.error('Fetch model error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch model',
    };
  }
};

/**
 * Update a model
 * @param {string} id - Model ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated model
 */
export const updateModel = async (id, updates) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(updates),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update model');
    }

    return data;
  } catch (error) {
    console.error('Update model error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update model',
    };
  }
};

/**
 * Delete a model
 * @param {string} id - Model ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteModel = async (id) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: 'DELETE',
      headers: headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete model');
    }

    return data;
  } catch (error) {
    console.error('Delete model error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete model',
    };
  }
};

/**
 * Increment view count for a model
 * @param {string} id - Model ID
 * @returns {Promise<Object>} Updated view count
 */
export const incrementViews = async (id) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/models/${id}/views`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to increment views');
    }

    return data;
  } catch (error) {
    console.error('Increment views error:', error);
    return {
      success: false,
      error: error.message || 'Failed to increment views',
    };
  }
};

/**
 * Get model statistics
 * @returns {Promise<Object>} Statistics summary
 */
export const getModelStats = async () => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/models/stats/summary`, {
      headers: headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch stats');
    }

    return data;
  } catch (error) {
    console.error('Fetch stats error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch stats',
    };
  }
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Promise<Object>} Validation result
 */
export const validateFile = async (file) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/upload/validate?filename=${encodeURIComponent(file.name)}&size=${file.size}`,
      {
        headers: headers,
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Validation failed');
    }

    return data;
  } catch (error) {
    console.error('Validation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate file',
    };
  }
};

/**
 * Create form data for upload
 * @param {File} file - The file to upload
 * @param {Object} metadata - Additional metadata
 * @returns {FormData} Prepared form data
 */
export const createUploadFormData = (file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata fields
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  
  return formData;
};

export default {
  uploadModel,
  getModels,
  fetchModels,
  fetchMyModels,
  getModelById,
  updateModel,
  deleteModel,
  incrementViews,
  getModelStats,
  validateFile,
  createUploadFormData,
  getModelURL,
};
