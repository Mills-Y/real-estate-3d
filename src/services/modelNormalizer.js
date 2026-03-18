import * as THREE from 'three';

/**
 * Model Normalization Configuration
 * Defines thresholds and default values for model positioning and scaling
 */
export const NORMALIZATION_CONFIG = {
  // Size thresholds (in scene units)
  MIN_MODEL_SIZE: 0.5,      // Minimum reasonable model size
  MAX_MODEL_SIZE: 100,      // Maximum reasonable model size
  TARGET_MODEL_SIZE: 10,    // Default normalized size (diagonal)

  // Spawn point configuration
  SPAWN_HEIGHT: 0,          // Height above grid (0 = on grid)
  SPAWN_HEIGHT_ABOVE_GRID: 0.1, // Slightly above grid to avoid z-fighting

  // Scaling constraints
  MIN_SCALE: 0.01,          // Minimum scale factor
  MAX_SCALE: 100,           // Maximum scale factor

  // Bounding box validation
  BOUNDING_BOX_THRESHOLDS: {
    WARNING: 150,           // Warn if any dimension > 150 units
    ERROR: 500              // Block if any dimension > 500 units
  },

  // Model validation
  VALIDATE_ON_UPLOAD: true, // Enable validation before upload
  AUTO_SCALE_EXTREME_MODELS: true, // Auto-scale very large/small models
};

/**
 * Validation Result Object
 */
export const createValidationResult = (isValid, warnings = [], errors = []) => ({
  isValid,
  warnings,
  errors,
  severity: errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'success'),
});

/**
 * Validate a Three.js model or geometry for potential issues
 * @param {THREE.Object3D|THREE.BufferGeometry} modelOrGeometry - Model or geometry to validate
 * @param {Object} config - Configuration override
 * @returns {Object} Validation result with warnings and errors
 */
export const validateModel = (modelOrGeometry, config = {}) => {
  const cfg = { ...NORMALIZATION_CONFIG, ...config };
  const warnings = [];
  const errors = [];

  try {
    let geometry = modelOrGeometry;

    // Extract geometry from Object3D if needed
    if (modelOrGeometry.isObject3D) {
      let foundGeometry = null;
      modelOrGeometry.traverse((child) => {
        if (child.isBufferGeometry && !foundGeometry) {
          foundGeometry = child;
        } else if (child.isMesh && child.geometry && !foundGeometry) {
          foundGeometry = child.geometry;
        }
      });
      geometry = foundGeometry;

      if (!geometry) {
        return createValidationResult(false, [], ['No valid geometry found in model']);
      }
    }

    // Ensure geometry has bounding box computed
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }

    const bbox = geometry.boundingBox;
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const minDim = Math.min(size.x, size.y, size.z);

    // Check for empty geometry
    if (maxDim === 0 || isNaN(maxDim)) {
      return createValidationResult(false, [], ['Model has invalid or zero dimensions']);
    }

    // Check for extremely small models
    if (maxDim < cfg.MIN_MODEL_SIZE) {
      warnings.push(
        `Model is very small (${maxDim.toFixed(2)} units). ` +
        `It may be difficult to view. Consider scaling up.`
      );
    }

    // Check for extremely large models
    if (maxDim > cfg.BOUNDING_BOX_THRESHOLDS.WARNING) {
      warnings.push(
        `Model is large (${maxDim.toFixed(2)} units). ` +
        `Performance may be affected.`
      );
    }

    // Check hard limits
    if (maxDim > cfg.BOUNDING_BOX_THRESHOLDS.ERROR) {
      errors.push(
        `Model exceeds maximum size threshold (${maxDim.toFixed(2)} > ${cfg.BOUNDING_BOX_THRESHOLDS.ERROR} units). ` +
        `Please optimize or scale down the model.`
      );
    }

    // Check for degenerate geometry (very flat models)
    if (minDim < maxDim * 0.01) {
      warnings.push(
        `Model appears very flat or thin. ` +
        `Verify that the model loaded correctly.`
      );
    }

    // Check for NaN or Infinity values
    if (!isFinite(maxDim) || !isFinite(minDim)) {
      return createValidationResult(false, [], ['Model contains invalid numerical values (NaN or Infinity)']);
    }

    return createValidationResult(errors.length === 0, warnings, errors);
  } catch (error) {
    return createValidationResult(false, [], [`Validation error: ${error.message}`]);
  }
};

/**
 * Normalize a model's position and scale
 * Centers horizontally and positions bottom slightly above ground
 * @param {THREE.Object3D} model - Model to normalize
 * @param {Object} config - Configuration override
 * @returns {Object} Normalization info { scale, originalSize, newSize, position }
 */
export const normalizeModel = (model, config = {}) => {
  const cfg = { ...NORMALIZATION_CONFIG, ...config };

  try {
    // Compute bounding box
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    const bottomY = bbox.min.y;

    const maxDim = Math.max(size.x, size.y, size.z);

    // Determine scale
    let scale = 1;
    if (cfg.AUTO_SCALE_EXTREME_MODELS) {
      // Auto-scale if model is extremely large or small
      if (maxDim > cfg.BOUNDING_BOX_THRESHOLDS.WARNING) {
        scale = cfg.TARGET_MODEL_SIZE / maxDim;
      } else if (maxDim < cfg.MIN_MODEL_SIZE) {
        scale = cfg.TARGET_MODEL_SIZE / maxDim;
      }
    }

    // Clamp scale to safe range
    scale = Math.max(cfg.MIN_SCALE, Math.min(scale, cfg.MAX_SCALE));

    // Apply scale if needed
    if (scale !== 1) {
      model.scale.multiplyScalar(scale);
      // Recompute bbox after scaling
      const scaledBbox = new THREE.Box3().setFromObject(model);
      const newSize = scaledBbox.getSize(new THREE.Vector3());
      const scaledBottomY = scaledBbox.min.y;

      // Center horizontally, position bottom above grid
      model.position.x = -scaledBbox.getCenter(new THREE.Vector3()).x;
      model.position.z = -scaledBbox.getCenter(new THREE.Vector3()).z;
      // Position bottom at grid level + spawn height
      model.position.y = -scaledBottomY + cfg.SPAWN_HEIGHT_ABOVE_GRID;

      return {
        scale,
        originalSize: size,
        newSize: newSize,
        position: model.position.clone(),
        normalized: true,
      };
    }

    // No scaling needed - just center horizontally and position bottom above grid
    const centerXZ = new THREE.Vector3(center.x, 0, center.z);
    model.position.x = -centerXZ.x;
    model.position.z = -centerXZ.z;
    // Position bottom at grid level + spawn height
    model.position.y = -bottomY + cfg.SPAWN_HEIGHT_ABOVE_GRID;

    return {
      scale: 1,
      originalSize: size,
      newSize: size,
      position: model.position.clone(),
      normalized: false,
    };
  } catch (error) {
    console.error('Error normalizing model:', error);
    return {
      scale: 1,
      error: error.message,
      normalized: false,
    };
  }
};

/**
 * Center a model at the scene origin without scaling
 * Positions bottom of model above grid
 * @param {THREE.Object3D} model - Model to center
 * @param {Object} config - Configuration override
 * @returns {Object} Position info { position, originalCenter }
 */
export const centerModel = (model, config = {}) => {
  const cfg = { ...NORMALIZATION_CONFIG, ...config };

  try {
    const bbox = new THREE.Box3().setFromObject(model);
    const center = bbox.getCenter(new THREE.Vector3());
    const bottomY = bbox.min.y;

    const originalCenter = center.clone();

    // Center horizontally, position bottom above grid
    model.position.x = -center.x;
    model.position.z = -center.z;
    // Position bottom at grid level + spawn height
    model.position.y = -bottomY + cfg.SPAWN_HEIGHT_ABOVE_GRID;

    return {
      position: model.position.clone(),
      originalCenter,
      centered: true,
    };
  } catch (error) {
    console.error('Error centering model:', error);
    return {
      error: error.message,
      centered: false,
    };
  }
};

/**
 * Get model dimensions and center information
 * @param {THREE.Object3D} model - Model to analyze
 * @returns {Object} Model metrics { size, maxDim, minDim, center, boundingBox }
 */
export const getModelMetrics = (model) => {
  try {
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());

    return {
      size: size,
      maxDim: Math.max(size.x, size.y, size.z),
      minDim: Math.min(size.x, size.y, size.z),
      center: center,
      boundingBox: {
        min: bbox.min.clone(),
        max: bbox.max.clone(),
      },
      volume: size.x * size.y * size.z,
    };
  } catch (error) {
    console.error('Error getting model metrics:', error);
    return null;
  }
};

/**
 * Apply automatic optimization to a model
 * Combines validation, normalization, and metrics
 * @param {THREE.Object3D} model - Model to optimize
 * @param {Object} config - Configuration override
 * @returns {Object} Complete optimization result
 */
export const optimizeModel = (model, config = {}) => {
  const cfg = { ...NORMALIZATION_CONFIG, ...config };
  const results = {
    validation: null,
    normalization: null,
    metrics: null,
    success: false,
  };

  try {
    // Step 1: Validate
    results.validation = validateModel(model, cfg);
    if (!results.validation.isValid && cfg.VALIDATE_ON_UPLOAD) {
      return results; // Stop if validation fails and is required
    }

    // Step 2: Normalize
    results.normalization = normalizeModel(model, cfg);

    // Step 3: Get metrics
    results.metrics = getModelMetrics(model);

    results.success = true;
    return results;
  } catch (error) {
    console.error('Error optimizing model:', error);
    results.error = error.message;
    return results;
  }
};

/**
 * Create a detailed report about model normalization
 * @param {Object} optimizationResult - Result from optimizeModel()
 * @returns {String} Human-readable report
 */
export const generateNormalizationReport = (optimizationResult) => {
  const { validation, normalization, metrics } = optimizationResult;
  let report = '📊 Model Normalization Report\n';
  report += '═'.repeat(40) + '\n\n';

  if (validation) {
    report += '✓ Validation:\n';
    if (validation.warnings.length > 0) {
      report += '  ⚠️  Warnings:\n';
      validation.warnings.forEach((w) => {
        report += `    • ${w}\n`;
      });
    }
    if (validation.errors.length > 0) {
      report += '  ❌ Errors:\n';
      validation.errors.forEach((e) => {
        report += `    • ${e}\n`;
      });
    }
    if (validation.warnings.length === 0 && validation.errors.length === 0) {
      report += '  ✅ No issues detected\n';
    }
  }

  if (normalization && !normalization.error) {
    report += '\n✓ Normalization:\n';
    report += `  Scale Applied: ${normalization.scale.toFixed(3)}x\n`;
    report += `  Original Size: ${normalization.originalSize.x.toFixed(2)} × ${normalization.originalSize.y.toFixed(2)} × ${normalization.originalSize.z.toFixed(2)}\n`;
    report += `  New Size: ${normalization.newSize.x.toFixed(2)} × ${normalization.newSize.y.toFixed(2)} × ${normalization.newSize.z.toFixed(2)}\n`;
    report += `  Position: (${normalization.position.x.toFixed(2)}, ${normalization.position.y.toFixed(2)}, ${normalization.position.z.toFixed(2)})\n`;
  }

  if (metrics) {
    report += '\n✓ Metrics:\n';
    report += `  Max Dimension: ${metrics.maxDim.toFixed(2)} units\n`;
    report += `  Center: (${metrics.center.x.toFixed(2)}, ${metrics.center.y.toFixed(2)}, ${metrics.center.z.toFixed(2)})\n`;
    report += `  Volume: ${metrics.volume.toFixed(2)} cubic units\n`;
  }

  return report;
};

export default {
  NORMALIZATION_CONFIG,
  validateModel,
  normalizeModel,
  centerModel,
  getModelMetrics,
  optimizeModel,
  generateNormalizationReport,
  createValidationResult,
};
