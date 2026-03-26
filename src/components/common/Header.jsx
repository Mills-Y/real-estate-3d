import React from 'react';
import PropTypes from 'prop-types';
import { Settings, Camera, Upload, Home, BarChart3 } from 'lucide-react';

const Header = ({ onSettingsClick, onScanClick, onUploadClick, onAnalyticsClick }) => {
  return (
    <header
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        gap: '1rem',
      }}>
        {/* Logo & Brand - Centered */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          width: '100%',
        }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              padding: '12px',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Home className="w-7 h-7 text-white" />
          </div>
          <div style={{
            textAlign: 'center',
          }}>
            <h1
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '1.875rem',
                fontWeight: 'bold',
                margin: '0',
              }}
            >
              RealEstate3D
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Professional Property Visualization</p>
          </div>
        </div>

        {/* Action Buttons - Centered & Responsive */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}>
          <button
            onClick={onAnalyticsClick}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 300ms',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            title="View Analytics"
          >
            <BarChart3 className="w-5 h-5" />
            <span style={{ display: 'none' }} className="sm:inline">Analytics</span>
          </button>

          <button
            onClick={onSettingsClick}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 300ms',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            title="Open Settings"
          >
            <Settings className="w-5 h-5" />
            <span style={{ display: 'none' }} className="sm:inline">Settings</span>
          </button>

          <button
            onClick={onScanClick}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 300ms',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            title="Scan Property"
          >
            <Camera className="w-5 h-5" />
            <span style={{ marginLeft: '0.5rem' }}>Scan</span>
          </button>

          <button
            onClick={onUploadClick}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 300ms',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            title="Upload Model"
          >
            <Upload className="w-5 h-5" />
            <span style={{ marginLeft: '0.5rem' }}>Upload</span>
          </button>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  onSettingsClick: PropTypes.func.isRequired,
  onScanClick: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func.isRequired,
  onAnalyticsClick: PropTypes.func.isRequired,
};

export default Header;
