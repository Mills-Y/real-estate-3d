import React, { useState, useEffect } from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute, { PublicOnlyRoute } from './components/common/ProtectedRoute';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import { useAuth } from './contexts/AuthContext';
import { LogOut, User, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Storage API Initialization
import { initializeStorageAPI } from './services/storageInitializer';

// Components
import Header from './components/common/Header';
import PropertyGallery from './components/features/Gallery/PropertyGallery';
import ScannerModal from './components/features/Scanner/ScannerModal';
import UploadModal from './components/features/Upload/UploadModal';
import ModelViewer from './components/features/Viewer/ModelViewer';
import ModelViewerWithAnalytics from './components/features/Viewer/ModelViewerWithAnalytics';
import SettingsModal from './components/settings/SettingsModal';
import Dashboard from './components/features/Analytics/Dashboard';
import ModelInfoPanel from './components/features/Analytics/ModelInfoPanel';

// Hooks
import { useThreeScene } from './hooks/useThreeScene';
import { useCameraStream } from './hooks/useCameraStream';
import { useKiriAPI } from './hooks/useKiriAPI';
import { useAnalytics } from './hooks/useAnalytics';

// Services
import {
  createSimple3DModel,
  loadPLYModel,
  loadGLTFModel,
} from './services/modelLoader';
import { uploadModel, createUploadFormData, deleteModel, getModelURL } from './services/apiService';

// Utilities
import { isValidModelFile, getFileType, createNewProperty } from './utils/validators';
import { getCurrentUserId } from './services/userSessionService';
import { removePropertyAnalytics, trackPropertyDeleted, trackFileUpload } from './services/analyticsService';

// Initialize storage API on app load
initializeStorageAPI();

const RealEstateScanner = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState('gallery');

  // Auth
  const { user } = useAuth();

  // Analytics
  const { trackView } = useAnalytics();

  // Modal states
  const [showScanModal, setShowScanModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showViewerAnalytics, setShowViewerAnalytics] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);

  // Properties
  const [properties, setProperties] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadIsPublic, setUploadIsPublic] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState([]);

  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [kiriIsPublic, setKiriIsPublic] = useState(false);

  // Custom hooks - UPDATED: Added sceneRef, cameraRef, rendererRef for AI integration
  const { mountRef, sceneRef, cameraRef, rendererRef, animationIdRef, initScene, cleanup: cleanupScene } = useThreeScene();
  const { videoRef, canvasRef, stream, startCamera, stopCamera, captureFrame } = useCameraStream();
  const { kiriApiKey, saveApiKey, isProcessingKiri, kiriProgress, kiriStatus, processWithKiri } = useKiriAPI();

  // Check if user is logged in before allowing certain actions
  const requireLogin = (action) => {
    if (!user) {
      alert('Please log in to ' + action);
      return false;
    }
    return true;
  };

  // Scanner functions
  const openScanModal = async () => {
    if (!requireLogin('scan properties')) return;

    const cameraResult = await startCamera();
    if (!cameraResult?.success) {
      alert(cameraResult?.message || 'Unable to access camera.');
      return;
    }

    setShowScanModal(true);
  setKiriIsPublic(false);
    // Track scanner modal opened
    trackView('scanner_opened', 'Scanner Modal', 0, {
      action: 'open'
    });
  };

  const closeScanModal = () => {
    setShowScanModal(false);
    stopCamera();
    setIsScanning(false);
    setCapturedFrames([]);
    setScanProgress(0);
    // Track scanner modal closed
    trackView('scanner_closed', 'Scanner Modal', 0, {
      action: 'close',
      capturedFrames: capturedFrames.length
    });
  };

  const handleManualCapture = () => {
    const frame = captureFrame();
    if (frame) {
      setCapturedFrames((prev) => [...prev, frame]);
      // Track manual frame capture
      trackView('frame_captured', 'Manual Capture', 0, {
        frameCount: capturedFrames.length + 1,
        captureMethod: 'manual'
      });
    } else {
      // Track capture failure
      trackView('frame_capture_failed', 'Manual Capture', 0, {
        error: 'Failed to capture frame from camera',
        captureMethod: 'manual'
      });
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanProgress(0);
    setCapturedFrames([]);
    window.scanStartTime = Date.now();

    // Track scan started
    trackView('scan_started', 'Auto Scan', 0, {
      scanType: 'auto_scan',
      targetFrames: 15
    });

    let frameCount = 0;
    const totalFrames = 15;

    const interval = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        setCapturedFrames((prev) => [...prev, frame]);
        frameCount++;
        setScanProgress((frameCount / totalFrames) * 100);

        if (frameCount >= totalFrames) {
          clearInterval(interval);
          setIsScanning(false);
          processScannedProperty();
        }
      }
    }, 600);
  };

  const processScannedProperty = () => {
    const scanDuration = Date.now() - (window.scanStartTime || Date.now());
    
    setTimeout(() => {
      const newProperty = createNewProperty({
        id: Date.now(),
        title: `Scanned Property ${properties.length + 1}`,
        location: 'Location TBD',
        image: capturedFrames[0],
        type: 'scan',
        beds: 0,
        baths: 0,
        sqft: 'N/A'
      });

      setProperties((prev) => [newProperty, ...prev]);
      stopCamera();
      setShowScanModal(false);
      setCapturedFrames([]);
      
      // Track successful scan
      trackView('scan_completed', `Scanned Property ${properties.length + 1}`, scanDuration, {
        frameCount: capturedFrames.length,
        duration: scanDuration,
        propertyId: newProperty.id,
        scanType: 'camera_scan'
      });
      
      alert('Property successfully scanned and uploaded!');
    }, 1000);
  };

  const handleUploadToKiri = () => {
    const kiriStartTime = Date.now();
    
    processWithKiri(
      capturedFrames,
      async (modelUrl, serialNumber) => {
        const kiriDuration = Date.now() - kiriStartTime;

        try {
          const importedTitle = `Kiri Scanned Property ${properties.length + 1}`;

          const modelResponse = await fetch(modelUrl);
          if (!modelResponse.ok) {
            throw new Error('Failed to read generated Kiri model for auto-import');
          }

          const modelBlob = await modelResponse.blob();
          const modelFile = new File([modelBlob], `${serialNumber}.glb`, {
            type: modelBlob.type || 'application/octet-stream',
          });

          const formData = createUploadFormData(modelFile, {
            title: importedTitle,
            description: `Auto-imported from Kiri scan job ${serialNumber}`,
            address: 'Location TBD',
            price: 0,
            type: 'kiri-scan',
            bedrooms: 0,
            bathrooms: 0,
            sqft: 0,
            isPublic: kiriIsPublic,
          });

          const uploadResult = await uploadModel(formData);
          if (!uploadResult?.success || !uploadResult?.data) {
            throw new Error(uploadResult?.error || 'Auto-import failed');
          }

          const serverModel = uploadResult.data;
          const newProperty = {
            id: serverModel.id,
            title: serverModel.title,
            price: serverModel.price || 0,
            location: serverModel.address || 'Location TBD',
            beds: serverModel.bedrooms || 0,
            baths: serverModel.bathrooms || 0,
            sqft: serverModel.sqft || 0,
            type: 'kiri-scan',
            image: serverModel.thumbnail,
            modelUrl: getModelURL(serverModel.modelPath),
            serialNumber,
            isPublic: serverModel.isPublic,
            uploadedAt: serverModel.uploadedAt,
          };

          setProperties((prev) => [newProperty, ...prev]);
          setGalleryRefreshKey((prev) => prev + 1);
          setActiveTab('myuploads');
          setShowScanModal(false);
          stopCamera();
          setCapturedFrames([]);
          setScanProgress(0);
          
          // Track successful Kiri scan
          trackView('kiri_scan_completed', `Kiri Scanned Property ${properties.length + 1}`, kiriDuration, {
            frameCount: capturedFrames.length,
            duration: kiriDuration,
            propertyId: newProperty.id,
            scanType: 'kiri_scan',
            serialNumber: serialNumber
          });
          
          alert('3D model created and auto-imported successfully!');
        } finally {
          URL.revokeObjectURL(modelUrl);
        }
      },
      (error) => {
        const kiriDuration = Date.now() - kiriStartTime;
        
        // Track Kiri scan failure
        trackView('kiri_scan_failed', 'Kiri Scan Error', kiriDuration, {
          duration: kiriDuration,
          error: error,
          scanType: 'kiri_scan'
        });
        
        alert(`Upload failed: ${error}`);
      }
    );
  };

  // Upload functions
  const handleUploadClick = () => {
    if (!requireLogin('upload models')) return;
    setUploadIsPublic(false);
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e) => {
    if (!requireLogin('upload models')) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidModelFile(file.name)) {
      setUploadError('Please upload GLB, GLTF, or PLY files only.');
      trackView('upload_validation_failed', 'File type rejected', 0, {
        fileName: file.name,
        fileSize: file.size,
        reason: 'invalid_file_type'
      });
      return;
    }

    const uploadStartTime = Date.now();
    const fileSize = file.size;
    const fileType = getFileType(file.name);

    // Track upload start
    trackView('upload_started', file.name, 0, {
      fileName: file.name,
      fileSize: fileSize,
      fileType: fileType,
      uploadedBy: getCurrentUserId()
    });

    try {
      setUploadError(null);
      setUploadProgress(0);

      // Create FormData with file and metadata
      const formData = createUploadFormData(file, {
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: `3D model: ${file.name}`,
        address: 'Location TBD',
        price: 0,
        type: 'upload',
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
        isPublic: uploadIsPublic
      });

      // Upload to server with progress
      const result = await uploadModel(formData, (progress) => {
        setUploadProgress(progress);
      });

      const uploadDuration = Date.now() - uploadStartTime;

      if (result.success) {
        const serverModel = result.data;

        // Create property object from server response
        const newProperty = {
          id: serverModel.id,
          title: serverModel.title,
          price: serverModel.price || 0,
          location: serverModel.address || 'Location TBD',
          beds: serverModel.bedrooms || 0,
          baths: serverModel.bathrooms || 0,
          sqft: serverModel.sqft || 0,
          type: 'upload',
          image: serverModel.thumbnail,
          modelUrl: getModelURL(serverModel.modelPath),
          fileType: serverModel.fileType?.toLowerCase() || fileType,
          fileSizeMB: serverModel.fileSizeMB,
          uploadedAt: serverModel.uploadedAt,
          isPublic: serverModel.isPublic
        };

        setProperties((prev) => [newProperty, ...prev]);
        setShowUploadModal(false);
        setUploadProgress(0);

        // Track successful upload
        trackFileUpload(newProperty, uploadDuration);

        alert('Model uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload model');
      
      // Track upload failure
      trackView('upload_failed', file.name, Date.now() - uploadStartTime, {
        fileName: file.name,
        error: error.message,
        fileSize: fileSize
      });
    }
  };

  // View property
  const viewProperty = (property) => {
    // Public models can be viewed by anyone
    // Private models can only be viewed by the owner
    setSelectedProperty(property);
    setShowViewer(true);

    // Track view
    trackView('model_viewed', property.title, 0, {
      propertyId: property.id,
      isPublic: property.isPublic
    });
  };

  // Close viewer
  const closeViewer = () => {
    setShowViewer(false);
    setSelectedProperty(null);
    cleanupScene();
  };

  useEffect(() => {
    if (showViewer) {
      setShowViewerAnalytics(true);
    }
  }, [showViewer]);

  // Delete property
  const deleteProperty = async (propertyId) => {
    if (!requireLogin('delete models')) return;
    
    const propertyToDelete = properties.find(p => p.id === propertyId);
    
    if (!propertyToDelete) {
      alert('Property not found');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${propertyToDelete.title}"?`)) {
      return;
    }

    try {
      // Call API to delete
      const result = await deleteModel(propertyId);
      
      if (result.success) {
        // Remove from local state
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        
        // Track deletion
        trackPropertyDeleted(propertyToDelete);
        removePropertyAnalytics(propertyId);
        
        alert('Model deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  // Initialize 3D viewer
  const init3DViewer = async () => {
    if (!mountRef.current || !selectedProperty) return;

    const { scene, camera, renderer, controls } = initScene(mountRef.current);

    const property = selectedProperty;

    try {
      if (property.modelUrl) {
        const resolvedModelUrl = getModelURL(property.modelUrl);
        let fileType = property.fileType?.toLowerCase() || 'glb';

        if (!property.fileType && resolvedModelUrl) {
          const urlWithoutQuery = resolvedModelUrl.split('?')[0];
          const ext = urlWithoutQuery.split('.').pop().toLowerCase();
          fileType = ext === 'ply' ? 'ply' : (ext === 'gltf' ? 'gltf' : 'glb');
        }

        console.log('📁 Detected file type:', fileType);
        console.log('🚀 Attempting to load model from:', resolvedModelUrl);

        try {
          if (fileType === 'ply') {
            await loadPLYModel(resolvedModelUrl, scene, camera);
          } else if (fileType === 'gltf') {
            await loadGLTFModel(resolvedModelUrl, scene, camera);
          } else {
            // Default to GLTF/GLB loader for unknown types
            await loadGLTFModel(resolvedModelUrl, scene, camera);
          }
          console.log('✅ Model loaded successfully from:', resolvedModelUrl);
        } catch (loadError) {
          console.error('❌ Failed to load model from URL:', resolvedModelUrl);
          console.error('Load error details:', loadError);
          throw loadError;
        }
      } else {
        console.warn('⚠️ No modelUrl provided, using fallback');
        console.warn('Property has these fields:', {
          id: property.id,
          title: property.title,
          type: property.type,
          modelUrl: property.modelUrl,
          fileType: property.fileType
        });
        const fallback = createSimple3DModel(
          property.type === 'scan' ? 'scanned' : 'house'
        );
        scene.add(fallback);
      }
    } catch (error) {
      console.error('❌ Error in init3DViewer:', error);
      console.error('Full error object:', error);
      console.error('Error stack:', error.stack);
      alert('Failed to load 3D model. Check console for details.');
      const fallback = createSimple3DModel(
        selectedProperty?.type === 'scan' ? 'scanned' : 'house'
      );
      scene.add(fallback);
    }
  };

  // Initialize 3D viewer when modal opens
  useEffect(() => {
    if (showViewer && selectedProperty) {
      setTimeout(() => {
        init3DViewer();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showViewer, selectedProperty]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      cleanupScene();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-container" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Header */}
      <div className="app-header">
        <Header
          onAnalyticsClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
          onSettingsClick={() => setShowSettingsModal(true)}
          onScanClick={openScanModal}
          onUploadClick={handleUploadClick}
        />
        <UserMenu/>
      </div>

      {/* Main Content with optional Analytics Panel */}
      <main className="app-main-with-panel" style={{ display: 'flex', flex: 1, width: '100%' }}>
        {/* Properties Section */}
        <div className="app-gallery-section" style={{
          flex: 1,
          overflowY: 'auto',
          transition: 'flex 0.3s ease'
        }}>
          <div className="content-wrapper">
            <PropertyGallery
              properties={properties}
              refreshKey={galleryRefreshKey}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onViewProperty={viewProperty}
              onDeleteProperty={deleteProperty}
            />
          </div>
        </div>

        {/* Analytics Side Panel */}
        {showAnalyticsPanel && (
          <div className="app-analytics-panel" style={{
            width: '420px',
            borderLeft: '1px solid rgba(148, 163, 184, 0.1)',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
            overflowY: 'auto',
            transition: 'width 0.3s ease',
            boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.3)'
          }}>
            <Dashboard 
              onClose={() => setShowAnalyticsPanel(false)} 
              isPanel={true}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <ScannerModal
        isOpen={showScanModal}
        stream={stream}
        videoRef={videoRef}
        canvasRef={canvasRef}
        capturedFrames={capturedFrames}
        isScanning={isScanning}
        scanProgress={scanProgress}
        isProcessingKiri={isProcessingKiri}
        kiriProgress={kiriProgress}
        kiriStatus={kiriStatus}
        kiriIsPublic={kiriIsPublic}
        onClose={closeScanModal}
        onCaptureFrame={handleManualCapture}
        onStartScanning={startScanning}
        onUploadToKiri={handleUploadToKiri}
        onKiriVisibilityChange={setKiriIsPublic}
      />

      <UploadModal
        isOpen={showUploadModal}
        isDragging={isDragging}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
        isPublic={uploadIsPublic}
        onVisibilityChange={setUploadIsPublic}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const files = e.dataTransfer.files;
          if (files?.[0]) {
            const file = files[0];
            if (isValidModelFile(file.name)) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              handleFileUpload({ target: { files: [file] } });
            } else {
              alert('Please upload a GLB, GLTF, or PLY file');
            }
          }
        }}
        onFileSelect={handleFileUpload}
        onClose={() => setShowUploadModal(false)}
      />

      {showViewer && (
        <button
          onClick={closeViewer}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 10002,
            background: '#dc2626',
            color: '#fff',
            padding: '0.6rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: '700',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
          }}
          aria-label="Exit viewer"
        >
          Exit Viewer
        </button>
      )}

      {showViewer && (
        <button
          onClick={() => setShowViewerAnalytics((prev) => !prev)}
          style={{
            position: 'fixed',
            top: '3.6rem',
            left: '1rem',
            zIndex: 10002,
            background: showViewerAnalytics ? '#334155' : '#0f172a',
            color: '#fff',
            padding: '0.55rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
          }}
          aria-label={showViewerAnalytics ? 'Hide analytics' : 'Show analytics'}
        >
          {showViewerAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      )}

      {showViewer && showViewerAnalytics && selectedProperty && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            right: '0',
            height: '100vh',
            width: '360px',
            zIndex: 10001,
            background: 'rgba(15, 23, 42, 0.95)',
            borderLeft: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '-2px 0 18px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <ModelInfoPanel property={selectedProperty} mountRef={mountRef} />
          </div>
        </div>
      )}

      {/* UPDATED: Pass scene, camera, renderer for AI Assistant integration */}
      <ModelViewerWithAnalytics
        isOpen={showViewer}
        property={selectedProperty}
        mountRef={mountRef}
        scene={sceneRef.current}
        camera={cameraRef.current}
        renderer={rendererRef.current}
        onClose={closeViewer}
        showAnalyticsByDefault={true}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        apiKey={kiriApiKey}
        onApiKeyChange={saveApiKey}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};

// UserMenu Component - shows login button if not logged in, user info + logout if logged in
function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  if (!user) {
    return (
      <button 
        onClick={() => navigate('/login')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          color: '#93c5fd',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
      >
        <LogIn size={16} />
        Log In
      </button>
    );
  }
  
  return (
    <>
      <span style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        color: '#cbd5e1',
        fontSize: '0.875rem'
      }}>
        <User size={18} />
        {user.name}
      </span>
      
      <button 
        onClick={logout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#fca5a5',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
      >
        <LogOut size={16} />
        Logout
      </button>
    </>
  );
}

// AppWithAuth Wrapper - main app is now PUBLIC, login/register are public-only
function AppWithAuth() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            } 
          />
          
          <Route 
            path="/register" 
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            } 
          />
          
          {/* Main app is now PUBLIC - anyone can view */}
          <Route 
            path="/*" 
            element={<RealEstateScanner />} 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default AppWithAuth;
