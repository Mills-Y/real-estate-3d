/**
 * RealTimeStats Component - Live engagement metrics with animations
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Users, Clock, Zap, Activity, Wifi } from 'lucide-react';
import './RealTimeStats.css';

const RealTimeStats = ({ data }) => {
  const [stats, setStats] = useState(data || {
    usersOnline: 0,
    activeModels: 0,
    avgSessionTime: 0,
    peakHourViews: 0,
  });
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (data) {
      setStats(data);
    }
  }, [data]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        usersOnline: Math.max(1, (prev.usersOnline || 0) + Math.floor(Math.random() * 5 - 2)),
        peakHourViews: (prev.peakHourViews || 0) + Math.floor(Math.random() * 3),
      }));
    }, 5000);

    // Blink the live indicator
    const blinkInterval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(blinkInterval);
    };
  }, []);

  const statItems = [
    {
      label: 'Live Users',
      value: stats?.usersOnline || 0,
      icon: Users,
      gradient: 'gradient-live',
      isLive: true,
    },
    {
      label: 'Active Models',
      value: stats?.activeModels || 0,
      icon: Activity,
      gradient: 'gradient-purple',
    },
    {
      label: 'Avg Session',
      value: `${stats?.avgSessionTime || 0}m`,
      icon: Clock,
      gradient: 'gradient-green',
    },
    {
      label: 'Peak Views',
      value: stats?.peakHourViews || 0,
      icon: Zap,
      gradient: 'gradient-orange',
    },
  ];

  return (
    <div className="realtime-stats">
      {/* Header */}
      <div className="realtime-header">
        <div className="realtime-title">
          <Wifi className="w-4 h-4" />
          <span>Real-Time Activity</span>
        </div>
        <div className={`live-indicator ${isLive ? 'active' : ''}`}>
          <span className="live-dot"></span>
          <span className="live-text">LIVE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="realtime-grid">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.label} 
              className={`realtime-card ${item.gradient}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="realtime-card-content">
                <div className="realtime-card-header">
                  <span className="realtime-card-label">{item.label}</span>
                  {item.isLive && (
                    <span className={`mini-live ${isLive ? 'active' : ''}`}></span>
                  )}
                </div>
                <div className="realtime-card-value">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </div>
              </div>
              <div className={`realtime-card-icon ${item.gradient}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Animated background pulse */}
              <div className="realtime-pulse"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

RealTimeStats.propTypes = {
  data: PropTypes.shape({
    usersOnline: PropTypes.number,
    activeModels: PropTypes.number,
    avgSessionTime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    peakHourViews: PropTypes.number,
  }),
};

export default RealTimeStats;
