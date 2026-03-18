/**
 * User Session Service
 * Manages current user identification using localStorage
 */

const USER_ID_KEY = 'realEstate3D_userId';
const USER_NAME_KEY = 'realEstate3D_userName';

/**
 * Get or create a unique user ID for the current session
 */
export const getCurrentUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    // Generate a unique ID based on timestamp and random string
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
};

/**
 * Get current user name (optional)
 */
export const getCurrentUserName = () => {
  return localStorage.getItem(USER_NAME_KEY) || 'Anonymous';
};

/**
 * Set user name
 */
export const setCurrentUserName = (name) => {
  if (name && name.trim()) {
    localStorage.setItem(USER_NAME_KEY, name);
  }
};

/**
 * Check if a property was uploaded by the current user
 */
export const isCurrentUserProperty = (property) => {
  const currentUserId = getCurrentUserId();
  return property.uploadedBy === currentUserId;
};

/**
 * Clear user session (logout)
 */
export const clearUserSession = () => {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
};
