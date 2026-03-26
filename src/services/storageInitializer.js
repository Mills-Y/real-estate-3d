/**
 * Storage Initializer - Initialize window.storage API
 * Provides a custom storage interface abstracted from localStorage implementation
 */

/**
 * Initialize the window.storage API
 * This provides get, set, delete, list, clear, and exists methods
 */
export const initializeStorageAPI = () => {
  if (typeof window !== 'undefined' && !window.storage) {
    window.storage = {
      /**
       * Get a value from storage
       * @param {string} key - Storage key
       * @param {*} defaultValue - Default value if key doesn't exist
       * @returns {*} Stored value or default value
       */
      get: (key, defaultValue = null) => {
        try {
          const item = localStorage.getItem(key);
          if (item === null) {
            return defaultValue;
          }
          // Try to parse as JSON first
          try {
            return JSON.parse(item);
          } catch {
            // Return as-is if not JSON
            return item;
          }
        } catch (error) {
          console.error(`Failed to get storage item "${key}":`, error);
          return defaultValue;
        }
      },

      /**
       * Set a value in storage
       * @param {string} key - Storage key
       * @param {*} value - Value to store (will be JSON stringified)
       * @returns {boolean} Success indicator
       */
      set: (key, value) => {
        try {
          const serialized = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, serialized);
          return true;
        } catch (error) {
          console.error(`Failed to set storage item "${key}":`, error);
          return false;
        }
      },

      /**
       * Delete a value from storage
       * @param {string} key - Storage key
       * @returns {boolean} Success indicator
       */
      delete: (key) => {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (error) {
          console.error(`Failed to delete storage item "${key}":`, error);
          return false;
        }
      },

      /**
       * Check if a key exists in storage
       * @param {string} key - Storage key
       * @returns {boolean} True if key exists
       */
      exists: (key) => {
        try {
          return localStorage.getItem(key) !== null;
        } catch (error) {
          console.error(`Failed to check storage item "${key}":`, error);
          return false;
        }
      },

      /**
       * List all keys in storage
       * @param {string} prefix - Optional prefix to filter keys
       * @returns {string[]} Array of matching keys
       */
      list: (prefix = '') => {
        try {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!prefix || key.startsWith(prefix)) {
              keys.push(key);
            }
          }
          return keys;
        } catch (error) {
          console.error('Failed to list storage keys:', error);
          return [];
        }
      },

      /**
       * Get all values with optional key filter
       * @param {string} prefix - Optional prefix to filter keys
       * @returns {object} Object with key-value pairs
       */
      getAll: (prefix = '') => {
        try {
          const items = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!prefix || key.startsWith(prefix)) {
              try {
                items[key] = JSON.parse(localStorage.getItem(key));
              } catch {
                items[key] = localStorage.getItem(key);
              }
            }
          }
          return items;
        } catch (error) {
          console.error('Failed to get all storage items:', error);
          return {};
        }
      },

      /**
       * Clear all storage or storage with specific prefix
       * @param {string} prefix - Optional prefix to filter keys
       * @returns {boolean} Success indicator
       */
      clear: (prefix = '') => {
        try {
          if (!prefix) {
            localStorage.clear();
            return true;
          }

          // Clear only items with prefix
          const keysToDelete = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach(key => localStorage.removeItem(key));
          return true;
        } catch (error) {
          console.error('Failed to clear storage:', error);
          return false;
        }
      },

      /**
       * Get storage size statistics
       * @returns {object} Object with size information
       */
      getSize: () => {
        try {
          let totalSize = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += key.length + value.length;
          }
          return {
            itemCount: localStorage.length,
            sizeBytes: totalSize,
            sizeKB: (totalSize / 1024).toFixed(2),
          };
        } catch (error) {
          console.error('Failed to get storage size:', error);
          return { itemCount: 0, sizeBytes: 0, sizeKB: '0' };
        }
      },
    };

    console.log('✓ window.storage API initialized');
  }
};

// Auto-initialize on module load
initializeStorageAPI();
