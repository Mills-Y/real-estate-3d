/**
 * Event Logger - Low-level event capture and filtering
 * Provides structured event logging with filtering and sampling capabilities
 */

const eventLog = [];
const eventSubscribers = new Map();

const EventTypes = {
  MODEL_LOAD: 'model:load',
  MODEL_ROTATE: 'model:rotate',
  MODEL_ZOOM: 'model:zoom',
  MODEL_PAN: 'model:pan',
  SCAN_START: 'scan:start',
  SCAN_COMPLETE: 'scan:complete',
  SCAN_CANCEL: 'scan:cancel',
  UPLOAD_START: 'upload:start',
  UPLOAD_COMPLETE: 'upload:complete',
  UPLOAD_ERROR: 'upload:error',
  EXPORT_START: 'export:start',
  EXPORT_COMPLETE: 'export:complete',
  USER_ACTION: 'user:action',
};

export { EventTypes };

/**
 * Log an event
 */
export const logEvent = (type, data = {}) => {
  const event = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
  };

  eventLog.push(event);
  notifySubscribers(type, event);

  // Console logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${type}]`, data);
  }

  return event;
};

/**
 * Subscribe to event type
 */
export const onEvent = (eventType, callback) => {
  if (!eventSubscribers.has(eventType)) {
    eventSubscribers.set(eventType, []);
  }
  
  const subscribers = eventSubscribers.get(eventType);
  subscribers.push(callback);

  // Return unsubscribe function
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
};

/**
 * Notify all subscribers of an event
 */
const notifySubscribers = (eventType, event) => {
  const subscribers = eventSubscribers.get(eventType) || [];
  subscribers.forEach(callback => {
    try {
      callback(event);
    } catch (error) {
      console.error(`Error in event subscriber for ${eventType}:`, error);
    }
  });
};

/**
 * Get recent events
 */
export const getRecentEvents = (limit = 50, type = null) => {
  let filtered = eventLog;
  
  if (type) {
    filtered = filtered.filter(e => e.type === type);
  }

  return filtered.slice(-limit);
};

/**
 * Get event statistics
 */
export const getEventStats = () => {
  const stats = {};
  
  eventLog.forEach(event => {
    if (!stats[event.type]) {
      stats[event.type] = { count: 0, lastOccurred: null };
    }
    stats[event.type].count++;
    stats[event.type].lastOccurred = event.timestamp;
  });

  return stats;
};

/**
 * Clear event log
 */
export const clearEventLog = () => {
  eventLog.length = 0;
};

/**
 * Export events for analysis
 */
export const exportEvents = (type = null) => {
  let events = eventLog;
  
  if (type) {
    events = events.filter(e => e.type === type);
  }

  return {
    exportTime: new Date().toISOString(),
    eventCount: events.length,
    events,
    stats: getEventStats(),
  };
};
