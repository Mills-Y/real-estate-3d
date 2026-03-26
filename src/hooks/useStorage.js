/**
 * useStorage Hook - Enhanced storage management using window.storage API
 */

import { useState, useCallback } from 'react';

export const useStorage = (key, initialValue = null) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.storage.get(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error(`Error reading from storage [${key}]:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.storage.set(key, valueToStore);
    } catch (error) {
      console.error(`Error writing to storage [${key}]:`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.storage.delete(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing from storage [${key}]:`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

export default useStorage;
