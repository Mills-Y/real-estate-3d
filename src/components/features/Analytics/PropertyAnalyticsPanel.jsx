import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, Eye, MousePointer, AlertCircle } from 'lucide-react';

const PropertyAnalyticsPanel = ({ property }) => {
  const [metrics, setMetrics] = useState({
    views: 0,
    scans: 0,
    engagement: 0,
    avgSessionTime: 0,
    interactionRate: 0,
    lastViewed: 'N/A',
  });

  // Mock property-specific analytics (in a real app, this would come from backend)
  useEffect(() => {
    if (property) {
      // Simulate loading property-specific metrics
      const mockMetrics = {
        views: Math.floor(Math.random() * 500) + 50,
        scans: Math.floor(Math.random() * 200) + 10,
        engagement: Math.floor(Math.random() * 100),
        avgSessionTime: (Math.random() * 5 + 1).toFixed(1), // minutes
        interactionRate: (Math.random() * 100).toFixed(1), // percentage
        lastViewed: new Date(Date.now() - Math.random() * 86400000).toLocaleString(),
      };
      setMetrics(mockMetrics);
    }
  }, [property]);

  if (!property) {
    return (
      <div className="p-4 text-center text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No property selected</p>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, unit = '', trend = null }) => (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
      <div className="flex items-start justify-between mb-2">
        <Icon className="w-4 h-4 text-blue-400" />
        {trend && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-gray-400 text-xs font-medium">{label}</p>
      <p className="text-white text-lg font-bold">
        {value}
        <span className="text-xs text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Property Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-3 border border-blue-500/20">
        <p className="text-xs text-gray-400 mb-1">Currently Viewing</p>
        <p className="text-white font-bold text-sm truncate">{property.title}</p>
        <p className="text-xs text-gray-400 truncate">{property.location}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-300 px-1">This Property</p>
        
        <StatCard 
          icon={Eye} 
          label="Total Views" 
          value={metrics.views}
          trend={Math.floor(Math.random() * 50) - 25}
        />
        
        <StatCard 
          icon={MousePointer} 
          label="Total Scans" 
          value={metrics.scans}
          trend={Math.floor(Math.random() * 50) - 25}
        />
        
        <StatCard 
          icon={TrendingUp} 
          label="Avg. Engagement" 
          value={metrics.engagement}
          unit="%"
          trend={Math.floor(Math.random() * 30) - 15}
        />
      </div>

      {/* Session Metrics */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-300 px-1">Session Data</p>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <p className="text-gray-400 text-xs font-medium mb-1">Avg. Session Time</p>
          <p className="text-white text-lg font-bold">
            {metrics.avgSessionTime}
            <span className="text-xs text-gray-400 ml-1">min</span>
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <p className="text-gray-400 text-xs font-medium mb-1">Interaction Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-white text-lg font-bold">{metrics.interactionRate}%</p>
            <div className="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${metrics.interactionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
        <p className="text-gray-400 text-xs font-medium mb-2">Last Viewed</p>
        <p className="text-white text-xs">{metrics.lastViewed}</p>
      </div>

      {/* Quick Insights */}
      <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-700/50">
        <p className="text-amber-500 text-xs font-semibold mb-1">💡 Insight</p>
        <p className="text-amber-200 text-xs">
          {metrics.engagement > 75 
            ? 'This property has excellent engagement!' 
            : metrics.engagement > 50 
            ? 'Good engagement - consider highlighting key features' 
            : 'Engagement is low - try adding more interactive elements'}
        </p>
      </div>
    </div>
  );
};

PropertyAnalyticsPanel.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    location: PropTypes.string,
  }),
};

export default PropertyAnalyticsPanel;
