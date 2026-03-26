/**
 * Analytics Helpers - Metric calculations and data transformations
 */

/**
 * Calculate engagement score based on interactions and time
 */
export const calculateEngagementScore = (interactions = 0, viewTimeSeconds = 0) => {
  if (viewTimeSeconds === 0) return 0;
  
  // Weight interactions heavier for short sessions
  const timeWeight = Math.min(viewTimeSeconds / 60, 2); // Cap at 2 minutes worth
  const interactionScore = (interactions * 10) / timeWeight;
  
  return Math.round(Math.min(interactionScore, 100));
};

/**
 * Calculate average metrics from dataset
 */
export const calculateAverageMetrics = (metrics) => {
  if (!metrics || metrics.length === 0) {
    return { avgViews: 0, avgInteractions: 0, avgEngagement: 0 };
  }

  const sum = metrics.reduce(
    (acc, m) => ({
      views: acc.views + (m.views || 0),
      interactions: acc.interactions + (m.interactions || 0),
      engagement: acc.engagement + (m.engagement || 0),
    }),
    { views: 0, interactions: 0, engagement: 0 }
  );

  return {
    avgViews: (sum.views / metrics.length).toFixed(1),
    avgInteractions: (sum.interactions / metrics.length).toFixed(1),
    avgEngagement: (sum.engagement / metrics.length).toFixed(1),
  };
};

/**
 * Format large numbers with abbreviations
 */
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

/**
 * Calculate growth rate between two periods
 */
export const calculateGrowthRate = (current, previous) => {
  if (previous === 0) return 100;
  return (((current - previous) / previous) * 100).toFixed(1);
};

/**
 * Get time period label
 */
export const getTimePeriodLabel = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

/**
 * Format date/time as 'Jan 18, 2026 • 6:31 AM'
 */
export const getFormattedDateTime = (date) => {
  try {
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) return '';
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateStr = dateObj.toLocaleDateString('en-US', options);
    
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeStr = dateObj.toLocaleTimeString('en-US', timeOptions);
    
    return `${dateStr} • ${timeStr}`;
  } catch (error) {
    return '';
  }
};

/**
 * Extract file type from filename (e.g., 'model.glb' => 'GLB')
 */
export const getFileType = (filename) => {
  if (!filename) return 'UNKNOWN';
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toUpperCase() : 'UNKNOWN';
};

/**
 * Calculate percentile rank
 */
export const calculatePercentile = (value, values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = sorted.filter(v => v <= value).length / sorted.length;
  return Math.round(rank * 100);
};

/**
 * Group metrics by time period
 */
export const groupByTimePeriod = (data, period = 'day') => {
  const grouped = {};

  data.forEach(item => {
    const date = new Date(item.date || item.timestamp);
    let key;

    switch (period) {
      case 'hour':
        key = date.toISOString().slice(0, 13);
        break;
      case 'day':
        key = date.toISOString().slice(0, 10);
        break;
      case 'week':
        const week = Math.floor((date - new Date(date.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        key = `${date.getFullYear()}-W${week}`;
        break;
      case 'month':
        key = date.toISOString().slice(0, 7);
        break;
      default:
        key = date.toISOString().slice(0, 10);
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  return grouped;
};

/**
 * Calculate trend direction and magnitude
 */
export const calculateTrend = (values) => {
  if (!values || values.length < 2) return { direction: 'stable', magnitude: 0 };

  const recent = values.slice(-5);
  const previous = values.slice(-10, -5);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  const magnitude = Math.abs(change).toFixed(1);

  return {
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    magnitude: parseFloat(magnitude),
    change: change.toFixed(1),
  };
};

/**
 * Advanced engagement scoring with multiple factors
 * Considers: interaction frequency, duration, variety, and recency
 */
export const calculateAdvancedEngagementScore = (interactions) => {
  if (!interactions || interactions.length === 0) return 0;

  const now = Date.now();
  let score = 0;

  // Factor 1: Interaction frequency (0-30 points)
  const frequencyScore = Math.min(interactions.length * 3, 30);

  // Factor 2: Session duration (0-30 points)
  const durations = interactions
    .filter(i => i.properties?.durationMs)
    .map(i => i.properties.durationMs);
  const totalDuration = durations.reduce((a, b) => a + b, 0);
  const durationScore = Math.min((totalDuration / 60000) * 5, 30); // 5 points per minute, max 30

  // Factor 3: Interaction variety (0-20 points)
  const eventTypes = new Set(interactions.map(i => i.name));
  const varietyScore = (eventTypes.size / 10) * 20; // Max 10 different types

  // Factor 4: Recency bonus (0-20 points)
  const lastInteractionTime = Math.max(...interactions.map(i => i.timestamp));
  const timeSinceLastInteraction = now - lastInteractionTime;
  const recencyScore = timeSinceLastInteraction < 300000 ? 20 : 0; // Full points if activity in last 5 minutes

  score = frequencyScore + durationScore + varietyScore + recencyScore;
  return Math.round(Math.min(score, 100));
};

/**
 * Generate heatmap zones from interaction data
 * Maps 3D model interactions to heatmap intensity grid
 */
export const generateHeatmapZones = (interactions, gridSize = 10) => {
  if (!interactions || interactions.length === 0) return [];

  const zones = Array(gridSize * gridSize).fill(0);
  
  // Count interactions per zone
  interactions.forEach(interaction => {
    // Map property ID and interaction type to grid position
    const propertyId = interaction.properties?.propertyId || 0;
    const interactionType = interaction.name;

    // Determine zone based on property and interaction type
    const baseZone = propertyId % gridSize;
    const typeOffset = (interactionType.charCodeAt(0) % gridSize);
    const zone = (baseZone + typeOffset) % (gridSize * gridSize);

    // Increase intensity for interaction type
    if (interactionType.includes('rotate')) zones[zone] += 3;
    else if (interactionType.includes('zoom')) zones[zone] += 2;
    else zones[zone] += 1;
  });

  // Convert to heatmap points with coordinates
  const heatmapPoints = [];
  for (let i = 0; i < zones.length; i++) {
    if (zones[i] > 0) {
      const x = (i % gridSize) * (100 / gridSize);
      const y = Math.floor(i / gridSize) * (100 / gridSize);
      const intensity = Math.min(zones[i] / 10, 1); // Normalize to 0-1

      heatmapPoints.push({
        x: x + (100 / (gridSize * 2)),
        y: y + (100 / (gridSize * 2)),
        intensity,
        count: zones[i],
      });
    }
  }

  return heatmapPoints;
};

/**
 * Calculate interaction metrics per property
 */
export const calculatePropertyMetrics = (interactions) => {
  const metrics = {};

  interactions.forEach(event => {
    const propertyId = event.properties?.propertyId;
    if (!propertyId) return;

    if (!metrics[propertyId]) {
      metrics[propertyId] = {
        propertyId,
        title: event.properties?.propertyTitle || 'Unknown',
        viewCount: 0,
        totalDuration: 0,
        totalInteractions: 0,
        rotations: 0,
        zooms: 0,
        avgEngagementScore: 0,
        lastViewed: event.timestamp,
      };
    }

    if (event.name === 'model_view_ended') {
      metrics[propertyId].viewCount++;
      metrics[propertyId].totalDuration += event.properties?.durationMs || 0;
      metrics[propertyId].totalInteractions += event.properties?.interactionCount || 0;
      metrics[propertyId].lastViewed = event.timestamp;
    } else if (event.name === 'model_rotate') {
      metrics[propertyId].rotations++;
    } else if (event.name === 'model_zoom') {
      metrics[propertyId].zooms++;
    }
  });

  // Calculate engagement score for each property
  Object.keys(metrics).forEach(propertyId => {
    const m = metrics[propertyId];
    if (m.viewCount > 0) {
      const avgDurationPerView = m.totalDuration / m.viewCount;
      const avgInteractionsPerView = m.totalInteractions / m.viewCount;
      m.avgEngagementScore = calculateEngagementScore(
        Math.round(avgInteractionsPerView),
        Math.round(avgDurationPerView / 1000)
      );
    }
  });

  return metrics;
};
