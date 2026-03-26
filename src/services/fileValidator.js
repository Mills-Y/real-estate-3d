/**
 * File Validation Utilities for Model Upload
 * Provides pre-upload validation without loading the entire model into Three.js
 */

// File type detection
const VALID_EXTENSIONS = {
  GLB: ['glb'],
  GLTF: ['gltf'],
  PLY: ['ply'],
};

const VALID_MIME_TYPES = {
  GLB: ['model/gltf-binary', 'application/octet-stream'],
  GLTF: ['model/gltf+json', 'application/json'],
  PLY: ['text/plain', 'application/octet-stream'],
};

const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE_MB: 500, // 500 MB max
  MIN_FILE_SIZE_KB: 1,   // At least 1 KB
  WARNING_SIZE_MB: 100,  // Warn above 100 MB
};

/**
 * File validation result
 */
const createFileValidationResult = (isValid, warnings = [], errors = []) => ({
  isValid,
  warnings,
  errors,
  severity: errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'success'),
});

/**
 * Get file extension
 * @param {string} filename - File name
 * @returns {string} File extension in lowercase
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Get file type from extension
 * @param {string} filename - File name
 * @returns {string|null} File type (GLB, GLTF, PLY) or null
 */
export const getFileTypeFromExtension = (filename) => {
  const ext = getFileExtension(filename);
  for (const [type, exts] of Object.entries(VALID_EXTENSIONS)) {
    if (exts.includes(ext)) {
      return type;
    }
  }
  return null;
};

/**
 * Validate file characteristics before upload
 * @param {File} file - File object from input
 * @param {Object} config - Configuration override
 * @returns {Object} Validation result
 */
export const validateFilePreUpload = (file, config = {}) => {
  const limits = { ...FILE_SIZE_LIMITS, ...config };
  const warnings = [];
  const errors = [];

  if (!file) {
    return createFileValidationResult(false, [], ['No file provided']);
  }

  // Check file size
  const fileSizeKB = file.size / 1024;
  const fileSizeMB = fileSizeKB / 1024;

  if (file.size < limits.MIN_FILE_SIZE_KB * 1024) {
    errors.push(
      `File is too small (${fileSizeKB.toFixed(2)} KB). ` +
      `Minimum size is ${limits.MIN_FILE_SIZE_KB} KB.`
    );
  }

  if (fileSizeMB > limits.MAX_FILE_SIZE_MB) {
    errors.push(
      `File exceeds maximum size (${fileSizeMB.toFixed(2)} MB > ${limits.MAX_FILE_SIZE_MB} MB). ` +
      `Please reduce the file size.`
    );
  } else if (fileSizeMB > limits.WARNING_SIZE_MB) {
    warnings.push(
      `Large file (${fileSizeMB.toFixed(2)} MB). Upload may take longer. ` +
      `Consider optimizing the model.`
    );
  }

  // Check file extension
  const fileType = getFileTypeFromExtension(file.name);
  if (!fileType) {
    errors.push(
      `Unsupported file format (.${getFileExtension(file.name)}). ` +
      `Supported formats: GLB, GLTF, PLY`
    );
  }

  // Check file type matches extension
  if (fileType && !VALID_MIME_TYPES[fileType].includes(file.type) && file.type !== '') {
    warnings.push(
      `File MIME type (${file.type}) doesn't match .${getFileExtension(file.name)} extension. ` +
      `This may indicate a mislabeled file.`
    );
  }

  // Check file name for special characters
  if (!/^[\w\s\-_.()]+$/.test(file.name)) {
    warnings.push(
      'File name contains special characters. ' +
      'This may cause issues on some systems. Consider renaming the file.'
    );
  }

  return createFileValidationResult(errors.length === 0, warnings, errors);
};

/**
 * Perform quick file header checks
 * Reads first few bytes to verify file format
 * @param {File} file - File object
 * @returns {Promise<Object>} Header validation result
 */
export const validateFileHeader = async (file) => {
  const warnings = [];
  const errors = [];

  try {
    const header = await file.slice(0, 100).arrayBuffer();
    const view = new Uint8Array(header);
    const headerText = String.fromCharCode(...view);

    const fileType = getFileTypeFromExtension(file.name);

    if (fileType === 'GLB') {
      // GLB files should start with "glTF" magic number (0x676C5446)
      const magic = view[0] === 0x67 && view[1] === 0x6C && view[2] === 0x54 && view[3] === 0x46;
      if (!magic) {
        errors.push('File header does not match GLB format. File may be corrupted.');
      }
    } else if (fileType === 'GLTF') {
      // GLTF files are JSON, should start with '{'
      if (!headerText.trimStart().startsWith('{')) {
        errors.push('File header does not match GLTF JSON format. File may be corrupted.');
      }
    } else if (fileType === 'PLY') {
      // PLY files should start with "ply"
      if (!headerText.includes('ply')) {
        errors.push('File header does not match PLY format. File may be corrupted.');
      }
    }

    return createFileValidationResult(errors.length === 0, warnings, errors);
  } catch (error) {
    return createFileValidationResult(false, [], [`Header validation error: ${error.message}`]);
  }
};

/**
 * Comprehensive file validation
 * Combines size, extension, and header checks
 * @param {File} file - File object
 * @param {Object} config - Configuration override
 * @returns {Promise<Object>} Complete validation result
 */
export const validateModelFile = async (file, config = {}) => {
  const allWarnings = [];
  const allErrors = [];

  // Pre-upload validation
  const preValidation = validateFilePreUpload(file, config);
  allWarnings.push(...preValidation.warnings);
  allErrors.push(...preValidation.errors);

  // If there are critical errors, stop here
  if (!preValidation.isValid) {
    return createFileValidationResult(false, allWarnings, allErrors);
  }

  // Header validation
  const headerValidation = await validateFileHeader(file);
  allWarnings.push(...headerValidation.warnings);
  allErrors.push(...headerValidation.errors);

  return createFileValidationResult(allErrors.length === 0, allWarnings, allErrors);
};

/**
 * Generate validation report for UI display
 * @param {Object} validationResult - Result from validateModelFile()
 * @param {string} filename - File name
 * @returns {Object} Report with severity and messages
 */
export const generateFileValidationReport = (validationResult, filename) => {
  const report = {
    filename,
    severity: validationResult.severity,
    summary: [],
    details: {
      warning: validationResult.warnings,
      error: validationResult.errors,
    },
  };

  // Build summary
  if (validationResult.errors.length > 0) {
    report.summary.push(`❌ ${validationResult.errors.length} error(s) found`);
  }
  if (validationResult.warnings.length > 0) {
    report.summary.push(`⚠️  ${validationResult.warnings.length} warning(s) found`);
  }
  if (validationResult.isValid && validationResult.warnings.length === 0) {
    report.summary.push('✅ File passed all validation checks');
  }

  return report;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get recommended settings for file
 * @param {File} file - File object
 * @returns {Object} Recommended settings
 */
export const getRecommendedSettings = (file) => {
  const fileSizeMB = file.size / 1024 / 1024;
  const fileType = getFileTypeFromExtension(file.name);

  return {
    fileType,
    fileSize: formatFileSize(file.size),
    compression: fileSizeMB > 100 ? 'recommended' : 'optional',
    optimization: fileSizeMB > 50 ? 'recommended' : 'optional',
    notes: [],
  };
};

/**
 * Create a user-friendly validation message
 * @param {Object} validationResult - Result from validateModelFile()
 * @returns {string} User-friendly message
 */
export const createValidationMessage = (validationResult) => {
  if (validationResult.isValid && validationResult.warnings.length === 0) {
    return '✅ File is ready for upload';
  }

  let message = '';

  if (validationResult.errors.length > 0) {
    message += '❌ Upload cannot proceed:\n';
    validationResult.errors.forEach((err) => {
      message += `  • ${err}\n`;
    });
  }

  if (validationResult.warnings.length > 0) {
    if (message) message += '\n';
    message += '⚠️  Warnings:\n';
    validationResult.warnings.forEach((warn) => {
      message += `  • ${warn}\n`;
    });
  }

  return message;
};

export default {
  validateFilePreUpload,
  validateFileHeader,
  validateModelFile,
  generateFileValidationReport,
  getFileExtension,
  getFileTypeFromExtension,
  formatFileSize,
  getRecommendedSettings,
  createValidationMessage,
  FILE_SIZE_LIMITS,
  VALID_EXTENSIONS,
};
