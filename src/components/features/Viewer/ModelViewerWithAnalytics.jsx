import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronRight, ChevronLeft, BarChart3, LayoutPanelLeft, Wind, Minimize2, Maximize2, Info, MessageCircle, Ruler } from 'lucide-react';
import { trackEvent, trackModelViewReal, trackScanCompletion } from '../../../services/analyticsService';
import { useModelTracking } from '../../../hooks/useModelTracking';
import { calculateEngagementScore } from '../../../utils/analyticsHelpers';
import ModelInfoPanel from '../Analytics/ModelInfoPanel';
import FloatingAnalyticsWidget from '../Analytics/FloatingAnalyticsWidget';
import AIAssistant from '../../AIAssistant';
import MeasureTool from '../../../utils/MeasureTool';

const ModelViewerWithAnalytics = ({ 
  isOpen, 
  property, 
  mountRef, 
  onClose, 
  showAnalyticsByDefault = true,
  scene = null,
  camera = null,
  renderer = null
}) => {
  const viewStartTime = useRef(Date.now());
  const interactionCount = useRef(0);
  const [engagementScore, setEngagementScore] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(showAnalyticsByDefault);
  const [analyticsMode, setAnalyticsMode] = useState('sidebar'); // 'sidebar' or 'floating'
  const [analyticsPanelWidth, setAnalyticsPanelWidth] = useState(350);
  const [isAnalyticsCollapsed, setIsAnalyticsCollapsed] = useState(false);
  const isResizing = useRef(false);

  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const measureToolRef = useRef(null);

  // Use model tracking hook for engagement score
  useModelTracking(
    property?.id,
    property?.title
  );

  // Initialize MeasureTool when scene is available
  useEffect(() => {
    if (isOpen && scene && camera && renderer) {
      measureToolRef.current = new MeasureTool(
        scene,
        camera,
        renderer,
        (measurement) => {
          const label = measurements.length === 0 ? 'First measurement' : 
                        `Measurement ${measurements.length + 1}`;
          setMeasurements(prev => [...prev, { ...measurement, label }]);
          console.log('📏 New measurement:', measurement.distance.toFixed(2), 'm');
        }
      );
    }

    return () => {
      if (measureToolRef.current) {
        measureToolRef.current.dispose();
        measureToolRef.current = null;
      }
    };
  }, [isOpen, scene, camera, renderer]);

  // Toggle measure mode
  useEffect(() => {
    if (measureToolRef.current) {
      if (isMeasureMode) {
        measureToolRef.current.activate();
      } else {
        measureToolRef.current.deactivate();
      }
    }
  }, [isMeasureMode]);

  useEffect(() => {
    if (isOpen) {
      setShowAnalytics(showAnalyticsByDefault);
      setIsAnalyticsCollapsed(false);
      setAnalyticsMode('sidebar');
      setMeasurements([]);
      setShowAIAssistant(false);
      setIsMeasureMode(false);
    }
  }, [isOpen, showAnalyticsByDefault]);

  // Track model view on open
  useEffect(() => {
    if (isOpen && property) {
      viewStartTime.current = Date.now();
      interactionCount.current = 0;
      setEngagementScore(0);
      trackEvent('model_view_started', {
        propertyId: property.id,
        propertyTitle: property.title,
        timestamp: new Date().toISOString(),
      });
      // Track view in backend for real-time analytics
      trackModelViewReal(property.id);
      console.log(`📊 Analytics: Started viewing ${property.title}`);
    }
  }, [isOpen, property]);

  // Track model view on close with duration, interactions, and engagement score
  useEffect(() => {
    return () => {
      if (isOpen && property) {
        const duration = Date.now() - viewStartTime.current;
        const finalEngagementScore = calculateEngagementScore(
          interactionCount.current,
          Math.round(duration / 1000)
        );
        
        trackEvent('model_view_ended', {
          propertyId: property.id,
          propertyTitle: property.title,
          durationMs: duration,
          durationSeconds: Math.round(duration / 1000),
          interactionCount: interactionCount.current,
          engagementScore: finalEngagementScore,
          measurementsTaken: measurements.length,
          timestamp: new Date().toISOString(),
        });
        
        // Record scan completion in backend with real metadata
        trackScanCompletion(
          property.id, 
          duration, 
          interactionCount.current > 5 ? 'detailed' : 'standard'
        );
        
        console.log(`📊 Analytics: Ended viewing ${property.title} | Duration: ${Math.round(duration / 1000)}s | Interactions: ${interactionCount.current} | Engagement: ${finalEngagementScore}%`);
      }
    };
  }, [isOpen, property, measurements]);

  // Handle resize of analytics panel
  const handleMouseDown = () => {
    isResizing.current = true;
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;

    const viewerRect = document.getElementById('model-viewer-container')?.getBoundingClientRect();
    if (!viewerRect) return;

    const newWidth = viewerRect.right - e.clientX;
    if (newWidth > 250 && newWidth < 600) {
      setAnalyticsPanelWidth(newWidth);
    }
  };

  // Handle ESC key to close viewer
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isResizing.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, []);

  const handleToggleMeasureMode = () => {
    setIsMeasureMode(!isMeasureMode);
    trackEvent('measure_mode_toggled', {
      propertyId: property?.id,
      enabled: !isMeasureMode
    });
  };

  const handleClearMeasurements = () => {
    if (measureToolRef.current) {
      measureToolRef.current.clearAll();
    }
    setMeasurements([]);
  };

  if (!isOpen || !property) return null;

  return (
    <div
      id="model-viewer-container"
      className="fixed inset-0 bg-black flex flex-col"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#000',
      }}
    >
      <button
        onClick={onClose}
        className="fixed top-4 left-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
        style={{ zIndex: 10001, pointerEvents: 'auto' }}
        title="Exit viewer"
      >
        <X className="w-5 h-5" />
        Exit Viewer
      </button>
      <button
        onClick={() => setShowAnalytics(!showAnalytics)}
        className="fixed top-16 left-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
        style={{ zIndex: 10001, pointerEvents: 'auto' }}
        title={showAnalytics ? 'Hide analytics' : 'Show analytics'}
      >
        <BarChart3 className="w-5 h-5" />
        {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
      </button>

      {/* AI Assistant Button */}
      <button
        onClick={() => setShowAIAssistant(!showAIAssistant)}
        className={`fixed top-28 left-4 font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 ${
          showAIAssistant 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-800 hover:bg-gray-700 text-white'
        }`}
        style={{ zIndex: 10001, pointerEvents: 'auto' }}
        title="AI Property Assistant"
      >
        <MessageCircle className="w-5 h-5" />
        AI Assistant
      </button>

      {/* Header */}
      <div
        className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900"
        style={{ flexShrink: 0, zIndex: 100 }}
      >
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{property.title}</h2>
          <p className="text-gray-400">{property.location}</p>
          {engagementScore > 0 && (
            <p className="text-sm text-blue-400 mt-1">
              📊 Engagement Score: <span className="font-bold">{engagementScore}%</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Analytics Mode Selector */}
          {showAnalytics && analyticsMode === 'sidebar' && (
            <button
              onClick={() => setAnalyticsMode('floating')}
              className="transition-all duration-200 rounded-lg p-3 bg-gray-700 hover:bg-gray-600 text-gray-300"
              title="Switch to floating widget"
              style={{ minWidth: '48px', minHeight: '48px', flexShrink: 0 }}
            >
              <Wind className="w-5 h-5" />
            </button>
          )}
          {showAnalytics && analyticsMode === 'floating' && (
            <button
              onClick={() => setAnalyticsMode('sidebar')}
              className="transition-all duration-200 rounded-lg p-3 bg-blue-600 hover:bg-blue-700 text-white"
              title="Switch to side panel"
              style={{ minWidth: '48px', minHeight: '48px', flexShrink: 0 }}
            >
              <LayoutPanelLeft className="w-5 h-5" />
            </button>
          )}
          {/* Analytics Toggle Button */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`transition-all duration-200 rounded-lg p-3 ${
              showAnalytics
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={showAnalytics ? 'Hide analytics' : 'Show analytics'}
            style={{ minWidth: '48px', minHeight: '48px', flexShrink: 0 }}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="text-white bg-red-600 hover:bg-red-700 rounded-lg p-3 flex items-center justify-center transition-all duration-200"
            style={{ minWidth: '48px', minHeight: '48px', flexShrink: 0 }}
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden bg-gray-950">
        {/* Model Viewer Section */}
        <div
          className="flex-1 relative flex flex-col"
          style={{
            backgroundColor: '#1a1a1a',
            overflow: 'hidden',
            transition: showAnalytics && analyticsMode === 'sidebar' ? 'none' : 'all 0.3s ease',
          }}
        >
          <div
            ref={mountRef}
            className="w-full h-full"
            style={{
              backgroundColor: '#2a2a2a',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: isMeasureMode ? 'crosshair' : 'grab',
            }}
          />

          {/* Measure Mode Indicator */}
          {isMeasureMode && (
            <div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
              style={{ zIndex: 100 }}
            >
              <Ruler className="w-4 h-4" />
              Tap two points to measure
            </div>
          )}

          {/* Controls Overlay */}
          <div
            className="absolute bottom-28 left-4 bg-black bg-opacity-60 text-white p-3 rounded-lg text-sm backdrop-blur-sm z-10 space-y-1"
          >
            <p className="font-semibold mb-2">Controls:</p>
            <p className="text-xs">• Left-click + drag to rotate</p>
            <p className="text-xs">• Right-click + drag to pan</p>
            <p className="text-xs">• Scroll to zoom in/out</p>
            <p className="text-xs text-blue-300 mt-2 pt-2 border-t border-gray-600">Press ESC to exit</p>
            
            {/* Measurements Display */}
            {measurements.length > 0 && (
              <>
                <p className="font-semibold mt-3 pt-2 border-t border-gray-600">📏 Measurements:</p>
                {measurements.slice(-3).map((m, i) => (
                  <p key={i} className="text-xs text-blue-300">
                    • {m.label}: {m.distance.toFixed(2)}m
                  </p>
                ))}
                <button
                  onClick={handleClearMeasurements}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                >
                  Clear measurements
                </button>
              </>
            )}
          </div>

          {/* Back to Dashboard Button */}
          <button
            onClick={onClose}
            className="absolute bottom-4 left-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-lg shadow-2xl transition-all duration-200 z-30 flex items-center gap-2 text-lg border-2 border-white"
            title="Return to dashboard (ESC)"
          >
            <X className="w-6 h-6" />
            EXIT VIEWER
          </button>

          {/* Additional Top Exit Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 z-30 flex items-center gap-2"
            title="Close viewer and return to dashboard"
          >
            <X className="w-5 h-5" />
            EXIT
          </button>

          {/* Toggle Analytics Button (Mini) */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-2 z-20 transition-all duration-200"
            title={showAnalytics ? 'Collapse analytics' : 'Expand analytics'}
          >
            {showAnalytics && analyticsMode === 'sidebar' ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>

          {/* Floating Analytics Widget */}
          {showAnalytics && analyticsMode === 'floating' && (
            <FloatingAnalyticsWidget 
              property={property}
              position="bottom-right"
              onClose={() => setShowAnalytics(false)}
            />
          )}
        </div>

        {/* Analytics Panel (Sidebar Mode) */}
        {showAnalytics && analyticsMode === 'sidebar' && (
          <>
            {/* Resize Handle - Only show when not collapsed */}
            {!isAnalyticsCollapsed && (
              <button
                onMouseDown={handleMouseDown}
                className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 border-0 p-0"
                style={{
                  flexShrink: 0,
                  zIndex: 50,
                }}
                aria-label="Resize analytics panel"
                title="Drag to resize"
              />
            )}

            {/* Analytics Sidebar */}
            <div
              className="bg-slate-900 border-l border-gray-700 overflow-hidden flex flex-col"
              style={{
                width: isAnalyticsCollapsed ? '50px' : `${analyticsPanelWidth}px`,
                flexShrink: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                transition: 'width 0.3s ease',
              }}
            >
              {isAnalyticsCollapsed ? (
                /* Collapsed State - Vertical Tab */
                <div className="h-full flex flex-col items-center gap-4 py-6 bg-slate-800 border-l-2 border-blue-500">
                  <button
                    onClick={() => setIsAnalyticsCollapsed(false)}
                    className="transform rotate-0 text-white hover:text-blue-400 transition-colors"
                    title="Expand model info panel"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                  <div className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap origin-center mt-8">
                    MODEL INFO
                  </div>
                  <button
                    onClick={() => setShowAnalytics(false)}
                    className="text-gray-400 hover:text-red-400 transition-colors mt-auto"
                    title="Close panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Expanded State */
                <>
                  {/* Panel Header */}
                  <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-bold text-sm">Model Information</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsAnalyticsCollapsed(true)}
                        className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-slate-700 transition-colors"
                        title="Minimize panel"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowAnalytics(false)}
                        className="text-gray-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-700 transition-colors"
                        title="Close panel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Panel Content */}
                  <div className="flex-1 overflow-hidden">
                    <ModelInfoPanel 
                      property={property}
                      mountRef={mountRef}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* AI Assistant Panel */}
      <AIAssistant
        modelId={property?.id}
        propertyData={property}
        measurements={measurements}
        isVisible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onMeasureModeToggle={handleToggleMeasureMode}
        isMeasureMode={isMeasureMode}
      />

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

ModelViewerWithAnalytics.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  property: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    location: PropTypes.string,
    modelFile: PropTypes.string,
    createdAt: PropTypes.string,
    uploadedAt: PropTypes.string,
    fileSize: PropTypes.number,
  }),
  mountRef: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  showAnalyticsByDefault: PropTypes.bool,
  scene: PropTypes.object,
  camera: PropTypes.object,
  renderer: PropTypes.object,
};

export default ModelViewerWithAnalytics;
