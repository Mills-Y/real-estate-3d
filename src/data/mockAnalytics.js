/**
 * Mock analytics data for dashboard and metrics visualization
 */

export const mockAnalyticsData = {
  totalScans: 156,
  activeModels: 42,
  averageEngagement: 78.5,
  monthlyGrowth: 12.3,
  
  dailyMetrics: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    scans: Math.floor(Math.random() * 15) + 3,
    views: Math.floor(Math.random() * 120) + 20,
    exports: Math.floor(Math.random() * 8) + 1,
  })),

  engagementByModel: [
    { modelId: 'model-001', name: 'Modern Office Space', engagement: 85, interactions: 342 },
    { modelId: 'model-002', name: 'Residential Villa', engagement: 72, interactions: 198 },
    { modelId: 'model-003', name: 'Commercial Building', engagement: 68, interactions: 156 },
    { modelId: 'model-004', name: 'Retail Store', engagement: 91, interactions: 428 },
    { modelId: 'model-005', name: 'Industrial Warehouse', engagement: 55, interactions: 87 },
  ],

  heatmapData: Array.from({ length: 50 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    intensity: Math.random() * 100,
  })),

  realTimeStats: {
    usersOnline: 23,
    activeModels: 7,
    avgSessionTime: 8.5,
    peakHourViews: 342,
  },

  exportStats: {
    totalExports: 287,
    formatBreakdown: {
      glb: 145,
      gltf: 89,
      ply: 53,
    },
    lastExports: [
      { modelName: 'Office Space', format: 'glb', timestamp: new Date(Date.now() - 5 * 60000), size: '2.4 MB' },
      { modelName: 'Villa', format: 'ply', timestamp: new Date(Date.now() - 15 * 60000), size: '3.8 MB' },
      { modelName: 'Building', format: 'gltf', timestamp: new Date(Date.now() - 45 * 60000), size: '5.2 MB' },
    ],
  },
};

export const getEngagementTrend = (days = 30) => {
  return mockAnalyticsData.dailyMetrics.slice(-days);
};

export const getTopModels = (limit = 5) => {
  return mockAnalyticsData.engagementByModel.slice(0, limit);
};

export const calculateAverageEngagement = () => {
  const sum = mockAnalyticsData.engagementByModel.reduce((acc, m) => acc + m.engagement, 0);
  return (sum / mockAnalyticsData.engagementByModel.length).toFixed(1);
};
