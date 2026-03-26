/**
 * MetricsGrid Component - Modern animated metric cards
 */

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, Eye, Activity, Download, Zap, Users } from 'lucide-react';
import './MetricsGrid.css';

// Animated counter hook
const useAnimatedCounter = (endValue, duration = 1500) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef(null);
  
  useEffect(() => {
    const numericValue = typeof endValue === 'number' ? endValue : parseFloat(endValue) || 0;
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      countRef.current = Math.floor(eased * numericValue);
      setCount(countRef.current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(numericValue);
      }
    };
    
    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [endValue, duration]);
  
  return count;
};

const MetricCard = ({ label, value, icon: Icon, gradient, delay = 0, compact = false }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animatedValue = useAnimatedCounter(numericValue);
  const isPercentage = typeof value === 'string' && value.includes('%');
  const isPositive = typeof value === 'string' && value.startsWith('+');
  
  const displayValue = isPercentage || isPositive 
    ? value 
    : animatedValue.toLocaleString();

  if (compact) {
    return (
      <div className="metric-card-compact" style={{ animationDelay: `${delay}ms` }}>
        <div className="metric-card-compact-header">
          <span className="metric-card-compact-label">{label}</span>
          <div className={`metric-card-compact-icon ${gradient}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="metric-card-compact-value">{displayValue}</div>
      </div>
    );
  }

  return (
    <div className="metric-card" style={{ animationDelay: `${delay}ms` }}>
      {/* Gradient border effect */}
      <div className="metric-card-border"></div>
      
      {/* Background glow */}
      <div className={`metric-card-glow ${gradient}`}></div>
      
      {/* Content */}
      <div className="metric-card-content">
        <div className="metric-card-header">
          <span className="metric-card-label">{label}</span>
          <div className={`metric-card-icon ${gradient}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        <div className="metric-card-value-wrapper">
          <span className="metric-card-value">{displayValue}</span>
          {isPositive && (
            <span className="metric-card-trend positive">
              <TrendingUp className="w-4 h-4" />
            </span>
          )}
        </div>
        
        {/* Animated bar */}
        <div className="metric-card-bar">
          <div 
            className={`metric-card-bar-fill ${gradient}`}
            style={{ 
              width: `${Math.min(100, (numericValue / 200) * 100)}%`,
              animationDelay: `${delay + 300}ms`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const MetricsGrid = ({ metrics, compact = false }) => {
  const metricCards = [
    {
      label: 'Total Scans',
      value: metrics?.totalScans || 0,
      icon: Activity,
      gradient: 'gradient-cyan',
    },
    {
      label: 'Active Models',
      value: metrics?.activeModels || 0,
      icon: Eye,
      gradient: 'gradient-purple',
    },
    {
      label: 'Avg Engagement',
      value: `${metrics?.averageEngagement || 0}%`,
      icon: Zap,
      gradient: 'gradient-green',
    },
    {
      label: 'Monthly Growth',
      value: `+${metrics?.monthlyGrowth || 0}%`,
      icon: TrendingUp,
      gradient: 'gradient-orange',
    },
  ];

  return (
    <div className={`metrics-grid ${compact ? 'compact' : ''}`}>
      {metricCards.map((card, index) => (
        <MetricCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          gradient={card.gradient}
          delay={index * 100}
          compact={compact}
        />
      ))}
    </div>
  );
};

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.elementType.isRequired,
  gradient: PropTypes.string.isRequired,
  delay: PropTypes.number,
  compact: PropTypes.bool,
};

MetricsGrid.propTypes = {
  metrics: PropTypes.shape({
    totalScans: PropTypes.number,
    activeModels: PropTypes.number,
    averageEngagement: PropTypes.number,
    monthlyGrowth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  compact: PropTypes.bool,
};

export default MetricsGrid;
