/**
 * useModelTracking Hook - Track 3D model interactions and engagement
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { logEvent, EventTypes } from '../services/eventLogger';

export const useModelTracking = (modelId, modelName) => {
  const [trackingData, setTrackingData] = useState({
    interactions: 0,
    rotations: 0,
    zooms: 0,
    pans: 0,
    viewTime: 0,
  });

  const viewStartTime = useRef(Date.now());
  const trackingRef = useRef(trackingData);

  useEffect(() => {
    trackingRef.current = trackingData;
  }, [trackingData]);

  const trackRotation = useCallback((deltaX, deltaY) => {
    logEvent(EventTypes.MODEL_ROTATE, {
      modelId,
      deltaX,
      deltaY,
      timestamp: new Date().toISOString(),
    });

    setTrackingData(prev => ({
      ...prev,
      rotations: prev.rotations + 1,
      interactions: prev.interactions + 1,
    }));
  }, [modelId]);

  const trackZoom = useCallback((direction, level) => {
    logEvent(EventTypes.MODEL_ZOOM, {
      modelId,
      direction,
      level,
      timestamp: new Date().toISOString(),
    });

    setTrackingData(prev => ({
      ...prev,
      zooms: prev.zooms + 1,
      interactions: prev.interactions + 1,
    }));
  }, [modelId]);

  const trackPan = useCallback((deltaX, deltaY) => {
    logEvent(EventTypes.MODEL_PAN, {
      modelId,
      deltaX,
      deltaY,
      timestamp: new Date().toISOString(),
    });

    setTrackingData(prev => ({
      ...prev,
      pans: prev.pans + 1,
      interactions: prev.interactions + 1,
    }));
  }, [modelId]);

  const getViewTime = useCallback(() => {
    return Date.now() - viewStartTime.current;
  }, []);

  const getEngagementScore = useCallback(() => {
    const interactions = trackingRef.current.interactions;
    const viewTime = getViewTime() / 1000; // Convert to seconds
    
    // Simple engagement formula: interactions per second viewed
    return viewTime > 0 ? (interactions / (viewTime / 60)).toFixed(2) : 0;
  }, [getViewTime]);

  useEffect(() => {
    const viewTime = getViewTime();
    setTrackingData(prev => ({
      ...prev,
      viewTime,
    }));
  }, [getViewTime]);

  return {
    trackRotation,
    trackZoom,
    trackPan,
    getViewTime,
    getEngagementScore,
    trackingData,
  };
};

export default useModelTracking;
