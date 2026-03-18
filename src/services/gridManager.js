/**
 * Grid Management Utilities
 * Handles dynamic grid resizing based on model dimensions
 */

import * as THREE from 'three';

const GRID_CONFIG = {
  DEFAULT_SIZE: 15,
  MIN_SIZE: 15,
  MAX_SIZE: 500,
  PADDING_MULTIPLIER: 1.2, // Add 20% padding to fit models comfortably
};

/**
 * Calculate required grid size based on model dimensions
 * @param {number} modelMaxDim - Largest dimension of the model
 * @returns {number} Calculated grid size with constraints
 */
export const calculateRequiredGridSize = (modelMaxDim) => {
  // Need grid size at least as large as model dimensions
  // Add padding for comfort
  let requiredSize = modelMaxDim * GRID_CONFIG.PADDING_MULTIPLIER;

  // Round up to nearest even number for clean grid
  requiredSize = Math.ceil(requiredSize / 2) * 2;

  // Apply constraints
  requiredSize = Math.max(GRID_CONFIG.MIN_SIZE, requiredSize);
  requiredSize = Math.min(GRID_CONFIG.MAX_SIZE, requiredSize);

  return requiredSize;
};

/**
 * Resize grid and ground plane in the scene
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {number} newSize - New size for grid (length of each side)
 * @returns {Object} { gridHelper, groundPlane, newSize }
 */
export const resizeGrid = (scene, newSize) => {
  try {
    // Validate size
    newSize = Math.max(GRID_CONFIG.MIN_SIZE, newSize);
    newSize = Math.min(GRID_CONFIG.MAX_SIZE, newSize);

    // Find and remove old grid and ground
    let gridHelper = null;
    let groundPlane = null;

    // Find grid helper
    scene.traverse((obj) => {
      if (obj.isGridHelper) {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
      if (obj.isMesh && obj.geometry instanceof THREE.PlaneGeometry) {
        // This is likely our ground plane
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    });

    // Create new ground plane
    const groundGeom = new THREE.PlaneGeometry(newSize, newSize);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x90ee90 });
    groundPlane = new THREE.Mesh(groundGeom, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // Create new grid helper
    gridHelper = new THREE.GridHelper(newSize, Math.floor(newSize / 2));
    scene.add(gridHelper);

    console.log(`📐 Grid resized to ${newSize}x${newSize} to fit model`);

    return {
      gridHelper,
      groundPlane,
      newSize,
    };
  } catch (error) {
    console.error('Error resizing grid:', error);
    return null;
  }
};

/**
 * Auto-resize grid based on model metrics
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} metrics - Model metrics from getModelMetrics
 * @returns {Object} { resized, newSize, previousSize }
 */
export const autoResizeGridForModel = (scene, metrics) => {
  if (!metrics || !metrics.maxDim) {
    return { resized: false, newSize: GRID_CONFIG.DEFAULT_SIZE };
  }

  const currentGridSize = GRID_CONFIG.DEFAULT_SIZE;
  const requiredSize = calculateRequiredGridSize(metrics.maxDim);

  // Check if resize is needed
  if (requiredSize > currentGridSize) {
    const resizeResult = resizeGrid(scene, requiredSize);
    if (resizeResult) {
      return {
        resized: true,
        newSize: resizeResult.newSize,
        previousSize: currentGridSize,
        modelMaxDim: metrics.maxDim,
      };
    }
  }

  return {
    resized: false,
    newSize: currentGridSize,
    modelMaxDim: metrics.maxDim,
  };
};

/**
 * Get current grid size from scene GridHelper
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {number} Grid size or DEFAULT_SIZE if not found
 */
export const getCurrentGridSize = (scene) => {
  let currentSize = GRID_CONFIG.DEFAULT_SIZE;

  scene.traverse((obj) => {
    if (obj.isGridHelper) {
      // GridHelper stores size in its userData or we can estimate from scale
      const scale = obj.scale;
      if (scale.x && scale.x !== 1) {
        currentSize = GRID_CONFIG.DEFAULT_SIZE * scale.x;
      }
    }
  });

  return currentSize;
};

export default {
  GRID_CONFIG,
  calculateRequiredGridSize,
  resizeGrid,
  autoResizeGridForModel,
  getCurrentGridSize,
};
