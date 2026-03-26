/**
 * Storage Service - Enhanced window.storage API wrapper
 * Uses custom window.storage interface for data persistence
 */

/**
 * Save data to storage using window.storage API
 */
export const saveToLocalStorage = (key, value) => {
  try {
    return window.storage.set(key, value);
  } catch (error) {
    console.error(`Failed to save to storage [${key}]:`, error);
    return false;
  }
};

/**
 * Get data from storage using window.storage API
 */
export const getFromLocalStorage = (key, defaultValue = '') => {
  try {
    const value = window.storage.get(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error(`Failed to get from storage [${key}]:`, error);
    return defaultValue;
  }
};

/**
 * Remove data from storage using window.storage API
 */
export const removeFromLocalStorage = (key) => {
  try {
    return window.storage.delete(key);
  } catch (error) {
    console.error(`Failed to remove from storage [${key}]:`, error);
    return false;
  }
};

/**
 * Clear all storage or storage with specific prefix using window.storage API
 */
export const clearLocalStorage = (prefix = '') => {
  try {
    return window.storage.clear(prefix);
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
};

/**
 * Get all storage keys using window.storage API
 */
export const getStorageKeys = (prefix = '') => {
  try {
    return window.storage.list(prefix);
  } catch (error) {
    console.error('Failed to get storage keys:', error);
    return [];
  }
};

/**
 * Get storage usage information using window.storage API
 */
export const getStorageUsage = () => {
  try {
    return window.storage.getSize();
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return { itemCount: 0, sizeBytes: 0, sizeKB: '0' };
  }
};

