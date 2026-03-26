import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X, Maximize2, Box, Smartphone } from 'lucide-react';

// Import model-viewer (add to index.html or install via npm)
// Option 1: Add this to public/index.html:
// <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
// Option 2: npm install @google/model-viewer

/**
 * ARModelViewer - Displays 3D models with AR support using Google Model Viewer
 * 
 * Features:
 * - 3D model viewing with orbit controls
 * - AR mode on supported mobile devices (iOS Safari, Android Chrome)
 * - Auto-rotate and zoom controls
 * - Responsive design
 */
const ARModelViewer = ({ isOpen, property, onClose }) => {
  const modelViewerRef = useRef(null);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !property) return null;

  // Construct the model URL using dynamic hostname (works on both localhost and mobile)
  const getModelUrl = () => {
    if (property.modelUrl) {
      // If modelUrl contains localhost, replace with current hostname
      if (property.modelUrl.includes('localhost')) {
        return property.modelUrl.replace('localhost', window.location.hostname);
      }
      return property.modelUrl;
    }
    if (property.modelPath) {
      // Use dynamic hostname so it works on mobile too
      const hostname = window.location.hostname;
      return `http://${hostname}:5000${property.modelPath}`;
    }
    return null;
  };

  const modelUrl = getModelUrl();
  
  // Log for debugging
  console.log('🎮 AR Viewer - Model URL:', modelUrl);

  if (!modelUrl) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h2 style={styles.title}>No Model Available</h2>
            <button onClick={onClose} style={styles.closeButton}>
              <X size={24} />
            </button>
          </div>
          <div style={styles.errorContent}>
            <Box size={64} style={{ color: '#6b7280', marginBottom: '1rem' }} />
            <p>This property does not have a 3D model attached.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <h2 style={styles.title}>{property.title || 'Property Viewer'}</h2>
            <span style={styles.subtitle}>{property.address || property.location}</span>
          </div>
          <div style={styles.headerActions}>
            <button 
              onClick={() => modelViewerRef.current?.requestFullscreen()}
              style={styles.iconButton}
              title="Fullscreen"
            >
              <Maximize2 size={20} />
            </button>
            <button onClick={onClose} style={styles.closeButton}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Model Viewer Container */}
        <div style={styles.viewerContainer}>
          <model-viewer
            ref={modelViewerRef}
            src={modelUrl}
            alt={`3D model of ${property.title}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            touch-action="pan-y"
            auto-rotate
            shadow-intensity="1"
            exposure="1"
            style={styles.modelViewer}
            poster={property.thumbnail || property.image}
            loading="eager"
            reveal="auto"
          >
            {/* AR Button - automatically shown on supported devices */}
            <button slot="ar-button" style={styles.arButton}>
              <Smartphone size={20} />
              View in AR
            </button>

            {/* Loading indicator */}
            <div slot="poster" style={styles.loadingPoster}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>Loading 3D Model...</p>
              <p style={styles.loadingUrl}>{modelUrl}</p>
            </div>

            {/* Progress bar */}
            <div slot="progress-bar" style={styles.progressBar}>
              <div style={styles.progressBarInner}></div>
            </div>
          </model-viewer>
        </div>

        {/* Footer with property info */}
        <div style={styles.footer}>
          <div style={styles.propertyInfo}>
            {property.beds > 0 && <span style={styles.infoItem}>{property.beds} beds</span>}
            {property.baths > 0 && <span style={styles.infoItem}>{property.baths} baths</span>}
            {property.sqft > 0 && <span style={styles.infoItem}>{property.sqft} sqft</span>}
          </div>
          <div style={styles.arHint}>
            <Smartphone size={16} />
            <span>Open on mobile for AR experience</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: '1rem',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'white',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  iconButton: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    color: '#60a5fa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    color: '#fca5a5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerContainer: {
    flex: 1,
    minHeight: '400px',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  modelViewer: {
    width: '100%',
    height: '100%',
    minHeight: '400px',
    backgroundColor: 'transparent',
    '--poster-color': 'transparent',
  },
  arButton: {
    position: 'absolute',
    bottom: '1rem',
    right: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  loadingPoster: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#0f172a',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '3px solid rgba(59, 130, 246, 0.3)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  loadingUrl: {
    marginTop: '0.5rem',
    color: '#64748b',
    fontSize: '0.625rem',
    maxWidth: '80%',
    wordBreak: 'break-all',
    textAlign: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  propertyInfo: {
    display: 'flex',
    gap: '1rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
  },
  arHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#60a5fa',
    fontSize: '0.75rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '0.375rem',
  },
  errorContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    color: '#94a3b8',
    textAlign: 'center',
  },
};

// Add keyframes for spinner animation (add to your CSS or use styled-components)
const spinnerKeyframes = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// Inject keyframes into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = spinnerKeyframes;
  document.head.appendChild(styleSheet);
}

ARModelViewer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  property: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    address: PropTypes.string,
    location: PropTypes.string,
    modelUrl: PropTypes.string,
    modelPath: PropTypes.string,
    thumbnail: PropTypes.string,
    image: PropTypes.string,
    beds: PropTypes.number,
    baths: PropTypes.number,
    sqft: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onClose: PropTypes.func.isRequired,
};

export default ARModelViewer;
