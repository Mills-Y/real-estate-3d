/**
 * Thumbnail Preloader Service
 * Automatically generates and caches thumbnails for all models
 */

import { generateModelThumbnail, getPlaceholderThumbnail } from './thumbnailGenerator';

// Global cache for all model thumbnails
const globalThumbnailCache = new Map();

/**
 * Preload thumbnails for a batch of models
 * Generates thumbnails in parallel with a concurrency limit
 */
export const preloadModelThumbnails = async (properties, maxConcurrent = 3) => {
  console.log(`🎨 Starting thumbnail preload for ${properties.length} models`);
  
  const results = new Map();
  const queue = [...properties];
  const active = new Set();
  
  return new Promise((resolve) => {
    const processNext = async () => {
      if (queue.length === 0 && active.size === 0) {
        console.log(`✅ Thumbnail preload complete. Cached: ${globalThumbnailCache.size}`);
        resolve(results);
        return;
      }
      
      while (active.size < maxConcurrent && queue.length > 0) {
        const property = queue.shift();
        const promise = generateSingleThumbnail(property)
          .then(thumbnail => {
            results.set(property.id, thumbnail);
            active.delete(promise);
            processNext();
          })
          .catch(error => {
            console.error(`Error generating thumbnail for ${property.title}:`, error);
            active.delete(promise);
            processNext();
          });
        
        active.add(promise);
      }
      
      if (queue.length === 0 && active.size === 0) {
        resolve(results);
      }
    };
    
    processNext();
  });
};

/**
 * Generate and cache a single thumbnail
 */
const generateSingleThumbnail = async (property) => {
  try {
    // Check global cache first
    if (globalThumbnailCache.has(property.id)) {
      console.log(`📦 Using cached thumbnail for: ${property.title}`);
      return globalThumbnailCache.get(property.id);
    }
    
    // Try to generate 3D model thumbnail
    if (property.modelUrl) {
      console.log(`🔄 Generating thumbnail for: ${property.title}`);
      const thumbnail = await generateModelThumbnail(property.modelUrl, property.title);
      
      if (thumbnail) {
        globalThumbnailCache.set(property.id, thumbnail);
        console.log(`✓ Generated 3D thumbnail for: ${property.title}`);
        return thumbnail;
      }
    }
    
    // Fallback: Use placeholder
    const placeholder = getPlaceholderThumbnail(property.title);
    globalThumbnailCache.set(property.id, placeholder);
    console.log(`⚠️ Using placeholder for: ${property.title}`);
    return placeholder;
  } catch (error) {
    console.error(`Thumbnail generation failed for ${property.title}:`, error);
    const placeholder = getPlaceholderThumbnail(property.title);
    globalThumbnailCache.set(property.id, placeholder);
    return placeholder;
  }
};

/**
 * Get cached thumbnail for a model
 */
export const getCachedThumbnail = (modelId) => {
  return globalThumbnailCache.get(modelId) || null;
};

/**
 * Get or generate thumbnail for a model (with automatic caching)
 */
export const getOrGenerateThumbnail = async (property) => {
  // Check cache first
  const cached = getCachedThumbnail(property.id);
  if (cached) {
    return cached;
  }
  
  // Generate and cache
  return generateSingleThumbnail(property);
};

/**
 * Clear the thumbnail cache
 */
export const clearThumbnailCache = () => {
  console.log(`🗑️ Clearing ${globalThumbnailCache.size} cached thumbnails`);
  globalThumbnailCache.clear();
};

/**
 * Get cache statistics
 */
export const getThumbnailCacheStats = () => {
  return {
    cachedCount: globalThumbnailCache.size,
    cacheKeys: Array.from(globalThumbnailCache.keys())
  };
};

export default {
  preloadModelThumbnails,
  getCachedThumbnail,
  getOrGenerateThumbnail,
  clearThumbnailCache,
  getThumbnailCacheStats
};
