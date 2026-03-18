/**
 * useAnalytics Hook - Event tracking and metrics management
 */

import { useEffect, useCallback, useState } from 'react';
import {
  trackEvent,
  trackModelView,
  trackModelInteraction,
  trackScanCreated,
  trackExport,
  getSessionMetrics,
  initializeAnalytics,
} from '../services/analyticsService';

export const useAnalytics = () => {
  const [sessionMetrics, setSessionMetrics] = useState(null);

  useEffect(() => {
    initializeAnalytics();
  }, []);

  const track = useCallback((eventName, properties = {}) => {
    trackEvent(eventName, properties);
  }, []);

  const trackView = useCallback((modelId, modelName, duration = 0) => {
    trackModelView(modelId, modelName, duration);
  }, []);

  const trackInteraction = useCallback((modelId, interactionType, details = {}) => {
    trackModelInteraction(modelId, interactionType, details);
  }, []);

  const trackScan = useCallback((scanId, scanType, duration) => {
    trackScanCreated(scanId, scanType, duration);
  }, []);

  const trackExportEvent = useCallback((modelId, format, size) => {
    trackExport(modelId, format, size);
  }, []);

  const getMetrics = useCallback(() => {
    const metrics = getSessionMetrics();
    setSessionMetrics(metrics);
    return metrics;
  }, []);

  return {
    track,
    trackView,
    trackInteraction,
    trackScan,
    trackExportEvent,
    getMetrics,
    sessionMetrics,
  };
};

export default useAnalytics;
