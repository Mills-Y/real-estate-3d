import React from 'react';
import PropTypes from 'prop-types';
import { X, Upload, AlertCircle } from 'lucide-react';

const UploadModal = ({
  isOpen,
  isDragging,
  uploadProgress,
  uploadError,
  isPublic,
  onVisibilityChange,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-gray-800 text-white rounded-lg p-6 max-w-md w-full shadow-2xl"
        style={{ margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
            Upload 3D Model
          </h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-white bg-red-600 hover:bg-red-700 rounded-full p-2 disabled:opacity-50"
            style={{ minWidth: '44px', minHeight: '44px' }}
            title="Close upload"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {uploadError && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#FCA5A5' }} />
            <p className="text-sm" style={{ color: '#FFEFEF' }}>
              {uploadError}
            </p>
          </div>
        )}

        {isUploading && (
          <div className="mb-4">
            <p className="text-sm mb-2" style={{ color: '#E5E7EB' }}>
              Uploading: {uploadProgress}%
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="mb-3 font-semibold" style={{ color: '#FFFFFF' }}>
            Supported formats:
          </p>
          <ul className="text-sm list-disc list-inside space-y-1" style={{ color: '#F0F0F0' }}>
            <li>GLB (Binary glTF)</li>
            <li>GLTF (GL Transmission Format)</li>
            <li>PLY (Polygon File Format / Point Cloud)</li>
          </ul>
        </div>

        <div className="mb-4">
          <p className="mb-2 font-semibold" style={{ color: '#FFFFFF' }}>
            Visibility:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => onVisibilityChange(false)}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                background: isPublic ? 'rgba(30, 41, 59, 0.6)' : 'rgba(245, 158, 11, 0.25)',
                color: '#FFFFFF',
                fontWeight: 600,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.6 : 1,
              }}
            >
              Private (My Uploads)
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => onVisibilityChange(true)}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                background: isPublic ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                color: '#FFFFFF',
                fontWeight: 600,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.6 : 1,
              }}
            >
              Public Gallery
            </button>
          </div>
        </div>

        <div
          className="border-2 border-dashed rounded-lg p-10 text-center mb-4 transition-all duration-200"
          style={{
            backgroundColor: isDragging ? '#DBEAFE' : '#E5E7EB',
            borderColor: isDragging ? '#3B82F6' : '#9CA3AF',
            borderWidth: '3px',
            opacity: isUploading ? 0.5 : 1,
            pointerEvents: isUploading ? 'none' : 'auto',
          }}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept=".glb,.gltf,.ply"
            onChange={onFileSelect}
            disabled={isUploading}
            style={{ display: 'none' }}
            id="file-upload-input"
          />
          <div
            onClick={() => !isUploading && document.getElementById('file-upload-input').click()}
            className="flex flex-col items-center gap-3 w-full cursor-pointer"
          >
            <Upload
              className="w-20 h-20"
              style={{ color: isDragging ? '#2563EB' : '#3B82F6' }}
            />
            <div>
              <p className="text-xl font-bold mb-1" style={{ color: '#1F2937' }}>
                {isDragging ? 'Drop your file here' : 'Drag & Drop or Click to Upload'}
              </p>
              <p className="text-sm font-medium" style={{ color: '#4B5563' }}>
                GLB, GLTF, or PLY files
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-3">
          <p className="text-sm" style={{ color: '#FFFFE0' }}>
            💡 <strong>Tip:</strong> Ensure your model is optimized and properly textured for
            best viewing experience.
          </p>
        </div>
      </div>
    </div>
  );
};

UploadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isDragging: PropTypes.bool.isRequired,
  uploadProgress: PropTypes.number.isRequired,
  uploadError: PropTypes.string,
  isPublic: PropTypes.bool,
  onVisibilityChange: PropTypes.func,
  onDragOver: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

UploadModal.defaultProps = {
  uploadError: null,
  isPublic: false,
  onVisibilityChange: () => {},
};

export default UploadModal;
