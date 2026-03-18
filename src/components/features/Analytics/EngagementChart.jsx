/**
 * EngagementChart Component - Modern engagement visualization
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { TrendingUp, Calendar, Filter } from 'lucide-react';
import './EngagementChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <div className="chart-tooltip-items">
          {payload.map((entry, index) => (
            <div key={index} className="chart-tooltip-item">
              <span 
                className="chart-tooltip-dot" 
                style={{ background: entry.color }}
              ></span>
              <span className="chart-tooltip-name">{entry.name}:</span>
              <span className="chart-tooltip-value">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const EngagementChart = ({ data = [], title = 'Engagement Trends', compact = false }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('area');

  // Format data for recharts
  const chartData = (data || []).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    scans: item.scans || 0,
    views: item.views || 0,
    exports: item.exports || 0,
  }));

  // Generate sample data if none provided
  const sampleData = chartData.length > 0 ? chartData : Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      scans: Math.floor(Math.random() * 50) + 10,
      views: Math.floor(Math.random() * 100) + 20,
      exports: Math.floor(Math.random() * 20) + 5,
    };
  });

  const timeRanges = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
  ];

  return (
    <div className={`engagement-chart ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="engagement-chart-header">
        <div className="engagement-chart-title">
          <div className="engagement-chart-icon">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2>{title}</h2>
            <p>Track your property engagement over time</p>
          </div>
        </div>

        {!compact && (
          <div className="engagement-chart-controls">
            <div className="time-range-selector">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`time-range-btn ${timeRange === range.id ? 'active' : ''}`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {!compact && (
        <div className="engagement-stats">
          <div className="engagement-stat">
            <span className="stat-value stat-scans">
              {sampleData.reduce((acc, item) => acc + item.scans, 0)}
            </span>
            <span className="stat-label">Total Scans</span>
          </div>
          <div className="engagement-stat">
            <span className="stat-value stat-views">
              {sampleData.reduce((acc, item) => acc + item.views, 0)}
            </span>
            <span className="stat-label">Total Views</span>
          </div>
          <div className="engagement-stat">
            <span className="stat-value stat-exports">
              {sampleData.reduce((acc, item) => acc + item.exports, 0)}
            </span>
            <span className="stat-label">Total Exports</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="engagement-chart-container">
        <ResponsiveContainer width="100%" height={compact ? 200 : 350}>
          <AreaChart data={sampleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientScans" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientExports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(148, 163, 184, 0.08)" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="date" 
              stroke="rgba(148, 163, 184, 0.5)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            
            <YAxis 
              stroke="rgba(148, 163, 184, 0.5)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {!compact && (
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px',
                }}
                iconType="circle"
                iconSize={8}
              />
            )}
            
            <Area
              type="monotone"
              dataKey="views"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradientViews)"
              name="Views"
            />
            
            <Area
              type="monotone"
              dataKey="scans"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#gradientScans)"
              name="Scans"
            />
            
            <Area
              type="monotone"
              dataKey="exports"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gradientExports)"
              name="Exports"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for compact mode */}
      {compact && (
        <div className="compact-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#06b6d4' }}></span>
            Scans
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#10b981' }}></span>
            Views
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
            Exports
          </span>
        </div>
      )}
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

EngagementChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string,
  compact: PropTypes.bool,
};

export default EngagementChart;
