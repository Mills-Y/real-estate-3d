import React, { useEffect, useRef, useState } from 'react';
import { X, MessageCircle, Ruler } from 'lucide-react';
import { trackEvent, trackModelViewReal, trackScanCompletion } from '../../../services/analyticsService';
import { useModelTracking } from '../../../hooks/useModelTracking';
import { calculateEngagementScore } from '../../../utils/analyticsHelpers';
import AIAssistant from '../../AIAssistant';
import MeasureTool from '../../../utils/MeasureTool';

const ModelViewer = ({ isOpen, property, mountRef, onClose, scene = null, camera = null, renderer = null }) => {
  const viewStartTime = useRef(Date.now());
  const interactionCount = useRef(0);
  const lastInteractionTime = useRef(Date.now());
  const [engagementScore, setEngagementScore] = useState(0);
  
  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const measureToolRef = useRef(null);

  // Use model tracking hook
  const { trackRotation, trackZoom, trackPan, getEngagementScore } = useModelTracking(
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
          // Add label based on measurement context
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

  // Track model view on open
  useEffect(() => {
    if (isOpen && property) {
      viewStartTime.current = Date.now();
      interactionCount.current = 0;
      setEngagementScore(0);
      setMeasurements([]);
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

  // Track interactions with throttling and update engagement score
  const trackInteraction = (type, details = {}) => {
    const now = Date.now();
    if (now - lastInteractionTime.current > 100) { // Throttle to 100ms
      interactionCount.current++;
      lastInteractionTime.current = now;
      
      // Track based on type
      if (type === 'rotate') {
        trackRotation(details.deltaX || 0, details.deltaY || 0);
      } else if (type === 'zoom') {
        trackZoom(details.direction === 'in' ? 1 : -1, 0);
      } else if (type === 'pan') {
        trackPan(details.deltaX || 0, details.deltaY || 0);
      }
      
      trackEvent(`model_${type}`, {
        propertyId: property?.id,
        interactionCount: interactionCount.current,
        ...details,
      });

      // Update engagement score periodically
      const currentScore = getEngagementScore();
      setEngagementScore(currentScore);
    }
  };

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
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.95)',
      }}
    >
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl flex flex-col" style={{ height: '85vh', maxHeight: '85vh' }}>
        <div
          className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800"
          style={{ flexShrink: 0, zIndex: 100 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-white">{property.title}</h2>
            <p className="text-gray-400">{property.location}</p>
            {engagementScore > 0 && (
              <p className="text-sm text-blue-400 mt-1">
                📊 Engagement Score: <span className="font-bold">{engagementScore}%</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* AI Assistant Button */}
            <button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className={`text-white rounded-full p-3 flex items-center justify-center transition-all ${
                showAIAssistant 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              style={{ minWidth: '48px', minHeight: '48px', flexShrink: 0 }}
              title="AI Property Assistant"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white bg-red-600 hover:bg-red-700 rounded-full p-3 flex items-center justify-center"
              style={{ minWidth: '48px', minHeight: '48px', flexShrink: 0 }}
              title="Close viewer"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative" style={{ backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
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

          {/* Floating Action Buttons */}
          <div
            className="absolute top-4 right-4 flex flex-col gap-2"
            style={{ zIndex: 1000 }}
          >
            <button
              onClick={onClose}
              className="text-white bg-red-600 hover:bg-red-700 rounded-full p-3 flex items-center justify-center shadow-lg"
              style={{
                minWidth: '56px',
                minHeight: '56px',
                cursor: 'pointer',
              }}
              title="Close viewer"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          {/* Measure Mode Indicator */}
          {isMeasureMode && (
            <div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
              style={{ zIndex: 1000 }}
            >
              <Ruler className="w-4 h-4" />
              Tap two points to measure
            </div>
          )}

          {/* Controls Info */}
          <div
            className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg text-sm"
            style={{ zIndex: 10 }}
          >
            <p className="font-semibold mb-1">Controls:</p>
            <p>• Left-click + drag to rotate</p>
            <p>• Right-click + drag to pan</p>
            <p>• Scroll to zoom in/out</p>
            {measurements.length > 0 && (
              <>
                <p className="font-semibold mt-2 mb-1">Measurements:</p>
                {measurements.slice(-3).map((m, i) => (
                  <p key={i} className="text-blue-300">
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
        </div>
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
    </div>
  );
};

export default ModelViewer;
