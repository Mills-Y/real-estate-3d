import React from 'react';
import { Camera, Play, X, Upload, Minimize2 } from 'lucide-react';

const ScannerModal = ({
  isOpen,
  stream,
  videoRef,
  canvasRef,
  capturedFrames,
  isScanning,
  scanProgress,
  isProcessingKiri,
  kiriProgress,
  kiriStatus,
  kiriIsPublic,
  canMinimize,
  onClose,
  onMinimize,
  onCaptureFrame,
  onStartScanning,
  onUploadToKiri,
  onKiriVisibilityChange,
}) => {
  if (!isOpen) return null;

  const showKiriOptions = capturedFrames.length >= 20 && !isScanning && !isProcessingKiri;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header - Compact */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
          Scanner
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canMinimize && isProcessingKiri && (
            <button
              onClick={onMinimize}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#9333ea',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Minimize scanner"
            >
              <Minimize2 style={{ width: '20px', height: '20px', color: '#fff' }} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Close scanner"
          >
            <X style={{ width: '22px', height: '22px', color: '#fff' }} />
          </button>
        </div>
      </div>

      {/* Camera View - Flexible height */}
      <div
        style={{
          flex: showKiriOptions ? '0 0 35vh' : '1 1 auto',
          minHeight: '150px',
          maxHeight: showKiriOptions ? '35vh' : '60vh',
          position: 'relative',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000',
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Photo Counter */}
        {capturedFrames.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {capturedFrames.length} photos
          </div>
        )}

        {/* Thumbnails */}
        {capturedFrames.length > 0 && !isScanning && !isProcessingKiri && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              display: 'flex',
              gap: '6px',
              maxWidth: '150px',
              overflowX: 'auto',
            }}
          >
            {capturedFrames.slice(-3).map((frame, i) => (
              <img
                key={i}
                src={frame}
                alt={`Frame ${i}`}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  border: '2px solid #22c55e',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Scanning Progress Overlay */}
        {isScanning && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera style={{ width: '40px', height: '40px', color: '#22c55e', marginBottom: '10px' }} />
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Scanning...
            </div>
            <div style={{ color: '#4ade80', fontSize: '16px', marginBottom: '10px' }}>
              {Math.round(scanProgress)}%
            </div>
            <div style={{ width: '160px', height: '6px', backgroundColor: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${scanProgress}%`,
                  height: '100%',
                  backgroundColor: '#22c55e',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}

        {/* Kiri Processing Overlay */}
        {isProcessingKiri && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #c084fc',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '10px',
              }}
            />
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>
              Kiri Processing
            </div>
            <p style={{ color: '#e9d5ff', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>
              {kiriStatus}
            </p>
            <div style={{ width: '160px', height: '6px', backgroundColor: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${kiriProgress}%`,
                  height: '100%',
                  backgroundColor: '#a855f7',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls Panel - Scrollable */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.98)',
          padding: '12px',
          overflowY: 'auto',
          maxHeight: showKiriOptions ? '55vh' : '45vh',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Manual Capture Button */}
        {!isScanning && !isProcessingKiri && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <button
              onClick={onCaptureFrame}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Camera style={{ width: '28px', height: '28px', color: '#fff' }} />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Auto Scan Button */}
          <button
            onClick={onStartScanning}
            disabled={isScanning || !stream || isProcessingKiri}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isScanning || !stream || isProcessingKiri ? '#4b5563' : '#10b981',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isScanning || !stream || isProcessingKiri ? 'not-allowed' : 'pointer',
            }}
          >
            <Play style={{ width: '18px', height: '18px' }} />
            <span>{isScanning ? 'Scanning...' : 'Auto Scan (15 frames)'}</span>
          </button>

          {/* Photo count warning */}
          {capturedFrames.length > 0 && capturedFrames.length < 20 && !isScanning && (
            <div
              style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#ca8a04',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                Need {20 - capturedFrames.length} more photos for Kiri Engine
              </p>
            </div>
          )}

          {/* Kiri Options */}
          {showKiriOptions && (
            <>
              {/* Visibility Toggle */}
              <div
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                }}
              >
                <p style={{ color: '#fff', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                  Kiri Import Visibility
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onKiriVisibilityChange(false)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      backgroundColor: kiriIsPublic ? 'rgba(30, 41, 59, 0.7)' : 'rgba(245, 158, 11, 0.3)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => onKiriVisibilityChange(true)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      backgroundColor: kiriIsPublic ? 'rgba(16, 185, 129, 0.3)' : 'rgba(30, 41, 59, 0.7)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Public
                  </button>
                </div>
              </div>

              {/* Upload to Kiri Button */}
              <button
                onClick={onUploadToKiri}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#9333ea',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(147, 51, 234, 0.4)',
                }}
              >
                <Upload style={{ width: '18px', height: '18px' }} />
                <span>Process with Kiri ({capturedFrames.length} photos)</span>
              </button>
            </>
          )}

          {/* Instructions */}
          {!isScanning && !isProcessingKiri && capturedFrames.length === 0 && (
            <div
              style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(30, 58, 138, 0.5)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#bfdbfe', fontSize: '12px', margin: 0 }}>
                Tap blue button to capture • Or use Auto Scan
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Spin animation for Kiri loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ScannerModal;
