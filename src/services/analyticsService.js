/**
 * Analytics Service - Core tracking and metrics collection
 * Handles event tracking, metric aggregation, and data persistence using window.storage API
 */

let analyticsBuffer = [];
let sessionStartTime = Date.now();
let sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const initializeAnalytics = () => {
  sessionStartTime = Date.now();
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  analyticsBuffer = [];
  console.log('Analytics initialized:', { sessionId });
};

/**
 * Track an event with properties
 * @param {string} eventName - Name of the event
 * @param {object} properties - Event properties
 */
export const trackEvent = (eventName, properties = {}) => {
  const event = {
    name: eventName,
    timestamp: Date.now(),
    sessionId,
    properties,
  };
  
  analyticsBuffer.push(event);
  
  // Log locally for development
  console.log('[Analytics Event]', eventName, properties);
  
  // Persist if buffer gets large
  if (analyticsBuffer.length >= 10) {
    persistAnalyticsBuffer();
  }
};

/**
 * Track model view
 */
export const trackModelView = (modelId, modelName, duration = 0) => {
  trackEvent('model_viewed', {
    modelId,
    modelName,
    duration,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track model interaction
 */
export const trackModelInteraction = (modelId, interactionType, details = {}) => {
  trackEvent('model_interaction', {
    modelId,
    type: interactionType,
    ...details,
  });
};

/**
 * Track scan creation
 */
export const trackScanCreated = (scanId, scanType, duration) => {
  trackEvent('scan_created', {
    scanId,
    type: scanType,
    duration,
  });
};

/**
 * Track model export
 */
export const trackExport = (modelId, format, size) => {
  trackEvent('model_exported', {
    modelId,
    format,
    size,
  });
};

/**
 * Track file upload with format analytics
 */
export const trackFileUpload = (fileName, fileSize, fileFormat, uploadDuration) => {
  trackEvent('file_uploaded', {
    fileName,
    fileSize,
    fileFormat: fileFormat.toUpperCase(),
    uploadDuration,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get file format statistics
 */
export const getFileFormatStats = () => {
  const events = analyticsBuffer.filter(e => e.name === 'file_uploaded');
  const formatCounts = {};
  const formatSizes = {};
  
  events.forEach(event => {
    const format = event.properties.fileFormat;
    formatCounts[format] = (formatCounts[format] || 0) + 1;
    formatSizes[format] = (formatSizes[format] || 0) + event.properties.fileSize;
  });
  
  return {
    totalUploads: events.length,
    byFormat: formatCounts,
    totalSizeByFormat: formatSizes,
    averageSizeByFormat: Object.keys(formatSizes).reduce((acc, format) => {
      acc[format] = formatSizes[format] / formatCounts[format];
      return acc;
    }, {})
  };
};

/**
 * Get session metrics
 */
export const getSessionMetrics = () => {
  const sessionDuration = Date.now() - sessionStartTime;
  return {
    sessionId,
    duration: sessionDuration,
    eventCount: analyticsBuffer.length,
    events: analyticsBuffer,
  };
};

/**
 * Persist analytics to storage using window.storage API
 */
export const persistAnalyticsBuffer = () => {
  try {
    const stored = window.storage.get('analyticsBuffer', []);
    const updated = [...stored, ...analyticsBuffer];
    window.storage.set('analyticsBuffer', updated.slice(-1000)); // Keep last 1000 events
    analyticsBuffer = [];
  } catch (error) {
    console.error('Failed to persist analytics:', error);
  }
};

/**
 * Fetch real analytics data from backend
 * @returns {Promise<Object>} Real analytics statistics from backend
 */
export const fetchRealAnalytics = async () => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
    const response = await fetch(`${API_BASE_URL}/models/stats/summary`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching real analytics:', error);
    return null;
  }
};

/**
 * Track a scan completion with real data
 * @param {string} modelId - ID of the model being scanned
 * @param {number} duration - Duration of scan in milliseconds
 * @param {string} scanType - Type of scan (standard, detailed, etc)
 */
export const trackScanCompletion = async (modelId, duration = 0, scanType = 'standard') => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
    
    // Track locally
    trackEvent('scan_completed', {
      modelId,
      duration,
      scanType,
      timestamp: new Date().toISOString()
    });
    
    // Send to backend
    const response = await fetch(`${API_BASE_URL}/models/${modelId}/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration,
        scanType
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Scan recorded:', data);
      return data;
    }
  } catch (error) {
    console.error('Error tracking scan completion:', error);
  }
};

/**
 * Track a model view with real data
 * @param {string} modelId - ID of the model being viewed
 */
export const trackModelViewReal = async (modelId) => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
    
    // Track locally
    trackEvent('model_view_tracked', {
      modelId,
      timestamp: new Date().toISOString()
    });
    
    // Send to backend
    const response = await fetch(`${API_BASE_URL}/models/${modelId}/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error tracking model view:', error);
  }
};

/**
 * Get formatted analytics data for dashboard display
 * @returns {Promise<Object>} Formatted analytics for display
 */
export const getDashboardAnalytics = async () => {
  try {
    const analyticsData = await fetchRealAnalytics();
    
    if (!analyticsData) {
      return {
        totalModels: 0,
        totalViews: 0,
        totalScans: 0,
        avgEngagement: 0,
        topModels: [],
        recentUploads: [],
        fileTypeStats: {}
      };
    }
    
    return {
      timestamp: analyticsData.timestamp,
      totalModels: analyticsData.totalModels,
      totalViews: analyticsData.totalViews,
      totalScans: analyticsData.totalScans,
      averageViews: analyticsData.averageViews,
      averageScans: analyticsData.averageScans,
      avgEngagement: analyticsData.avgEngagement,
      topModels: analyticsData.topModels || [],
      recentUploads: analyticsData.recentUploads || [],
      fileTypeStats: analyticsData.fileTypeStats || {},
      propertyTypeStats: analyticsData.propertyTypeStats || {}
    };
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    return null;
  }
};

/**
 * Export real analytics data
 */
export const exportRealAnalyticsData = async () => {
  try {
    const data = await fetchRealAnalytics();
    return {
      exportTime: new Date().toISOString(),
      analytics: data
    };
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return null;
  }
};



/**
 * Export analytics for reporting (legacy - uses local storage)
 */
const exportAnalytics = () => {
  persistAnalyticsBuffer();
  try {
    const stored = window.storage.get('analyticsBuffer', []);
    return {
      sessionId,
      exportTime: new Date().toISOString(),
      events: stored,
      summary: {
        totalEvents: stored.length,
        uniqueEventTypes: [...new Set(stored.map(e => e.name))],
        sessionDuration: Date.now() - sessionStartTime,
      },
    };
  } catch (error) {
    console.error('Failed to export analytics:', error);
    return null;
  }
};

/**
 * Export analytics as CSV format
 * @returns {string} CSV formatted string
 */
export const exportAnalyticsAsCSV = () => {
  try {
    persistAnalyticsBuffer();
    const stored = window.storage.get('analyticsBuffer', []);
    
    if (stored.length === 0) {
      return 'Event Name,Timestamp,Session ID,Properties\nNo data available';
    }

    // CSV headers
    const headers = ['Event Name', 'Timestamp', 'Session ID', 'Duration (ms)', 'Interaction Count', 'Property ID', 'Full Details'];
    
    // CSV rows
    const rows = stored.map(event => [
      event.name,
      new Date(event.timestamp).toISOString(),
      event.sessionId,
      event.properties?.durationMs || '',
      event.properties?.interactionCount || '',
      event.properties?.propertyId || '',
      JSON.stringify(event.properties || {}),
    ]);

    // Convert to CSV string
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        const stringCell = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma
        return stringCell.includes(',') ? `"${stringCell.replace(/"/g, '""')}"` : stringCell;
      }).join(',') + '\n';
    });

    return csv;
  } catch (error) {
    console.error('Failed to export analytics as CSV:', error);
    return null;
  }
};

/**
 * Download analytics as CSV file
 * @param {string} filename - Name of the file to download
 */
export const downloadAnalyticsCSV = (filename = 'analytics.csv') => {
  const csv = exportAnalyticsAsCSV();
  if (!csv) return false;

  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Failed to download CSV:', error);
    return false;
  }
};

/**
 * Download analytics as JSON file
 * @param {string} filename - Name of the file to download
 */
export const downloadAnalyticsJSON = (filename = 'analytics.json') => {
  const analyticsData = exportAnalytics();
  if (!analyticsData) return false;

  try {
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Failed to download JSON:', error);
    return false;
  }
};

/**
 * Get analytics summary statistics
 */
export const getAnalyticsSummary = () => {
  try {
    const stored = window.storage.get('analyticsBuffer', []);
    const eventCounts = {};
    const propertyMetrics = {};

    // Count events and track property metrics
    stored.forEach(event => {
      // Count event types
      eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;

      // Track property-specific metrics
      const propertyId = event.properties?.propertyId;
      if (propertyId) {
        if (!propertyMetrics[propertyId]) {
          propertyMetrics[propertyId] = {
            propertyId,
            title: event.properties?.propertyTitle || 'Unknown',
            viewCount: 0,
            totalDuration: 0,
            totalInteractions: 0,
            lastViewed: event.timestamp,
          };
        }
        
        if (event.name === 'model_view_ended') {
          propertyMetrics[propertyId].viewCount++;
          propertyMetrics[propertyId].totalDuration += event.properties?.durationMs || 0;
          propertyMetrics[propertyId].totalInteractions += event.properties?.interactionCount || 0;
          propertyMetrics[propertyId].lastViewed = event.timestamp;
        }
      }
    });

    return {
      totalEvents: stored.length,
      eventTypes: eventCounts,
      properties: Object.values(propertyMetrics).sort((a, b) => b.viewCount - a.viewCount),
      topProperty: Object.values(propertyMetrics).reduce((top, curr) => 
        curr.viewCount > (top?.viewCount || 0) ? curr : top, null),
    };
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return null;
  }
};

/**
 * Clear analytics data
 */
export const clearAnalytics = () => {
  analyticsBuffer = [];
  try {
    window.storage.delete('analyticsBuffer');
  } catch (error) {
    console.error('Failed to clear analytics:', error);
  }
};
/**
 * Remove all analytics events for a deleted property
 * @param {string|number} propertyId - The ID of the deleted property
 */
export const removePropertyAnalytics = (propertyId) => {
  try {
    const stored = window.storage.get('analyticsBuffer', []);
    
    // Filter out all events related to this property
    const filtered = stored.filter(event => {
      return event.properties?.propertyId !== propertyId;
    });
    
    // Update the buffer
    analyticsBuffer = filtered;
    window.storage.set('analyticsBuffer', filtered);
    
    console.log(`🗑️ Removed ${stored.length - filtered.length} analytics events for deleted property ${propertyId}`);
  } catch (error) {
    console.error('Failed to remove property analytics:', error);
  }
};

/**
 * Track property deletion event
 * @param {string|number} propertyId - The ID of the deleted property
 * @param {string} propertyTitle - The title of the deleted property
 */
export const trackPropertyDeleted = (propertyId, propertyTitle) => {
  trackEvent('property_deleted', {
    propertyId,
    propertyTitle,
    timestamp: new Date().toISOString(),
  });
};