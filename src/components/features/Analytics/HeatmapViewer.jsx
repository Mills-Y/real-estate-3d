/**
 * HeatmapViewer Component - Modern interaction heatmap visualization
 */

import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Flame, Info, RefreshCw } from 'lucide-react';
import './HeatmapViewer.css';

const HeatmapViewer = ({ data = [], title = '3D Model Interaction Heatmap' }) => {
  const canvasRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas with dark background
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid background
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let i = 0; i < rect.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, rect.height);
      ctx.stroke();
    }
    for (let i = 0; i < rect.height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(rect.width, i);
      ctx.stroke();
    }

    // Use provided data or generate sample data
    const heatmapData = data && data.length > 0 ? data : generateSampleData();

    // Find max intensity for normalization
    const maxIntensity = Math.max(...heatmapData.map(p => p.intensity || 0), 1);

    // Draw heatmap points with glow effect
    heatmapData.forEach((point, index) => {
      const x = (point.x / 100) * rect.width;
      const y = (point.y / 100) * rect.height;
      const normalizedIntensity = Math.min((point.intensity || 0) / maxIntensity, 1);
      const radius = 20 + (normalizedIntensity * 30);

      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      // Color based on intensity (blue -> green -> yellow -> red)
      let color;
      if (normalizedIntensity < 0.25) {
        color = { r: 59, g: 130, b: 246 }; // Blue
      } else if (normalizedIntensity < 0.5) {
        color = { r: 16, g: 185, b: 129 }; // Green
      } else if (normalizedIntensity < 0.75) {
        color = { r: 245, g: 158, b: 11 }; // Yellow/Orange
      } else {
        color = { r: 239, g: 68, b: 68 }; // Red
      }

      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.8 * normalizedIntensity + 0.2})`);
      gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 * normalizedIntensity})`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw count label for high intensity zones
      if (point.count && normalizedIntensity > 0.3) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(point.count.toString(), x, y);
      }
    });

    // Draw legend
    drawLegend(ctx, rect.width, rect.height);

  }, [data]);

  const generateSampleData = () => {
    const points = [];
    for (let i = 0; i < 25; i++) {
      points.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        intensity: Math.random() * 100,
        count: Math.floor(Math.random() * 50) + 1,
      });
    }
    return points;
  };

  const drawLegend = (ctx, width, height) => {
    const legendX = width - 130;
    const legendY = 15;
    const legendWidth = 115;
    const legendHeight = 70;

    // Background
    ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY, legendWidth, legendHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('INTENSITY', legendX + 10, legendY + 18);

    // Gradient bar
    const gradientBar = ctx.createLinearGradient(legendX + 10, 0, legendX + legendWidth - 10, 0);
    gradientBar.addColorStop(0, '#3b82f6');
    gradientBar.addColorStop(0.33, '#10b981');
    gradientBar.addColorStop(0.66, '#f59e0b');
    gradientBar.addColorStop(1, '#ef4444');
    
    ctx.fillStyle = gradientBar;
    ctx.beginPath();
    ctx.roundRect(legendX + 10, legendY + 28, legendWidth - 20, 12, 4);
    ctx.fill();

    // Labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Low', legendX + 10, legendY + 55);
    ctx.textAlign = 'right';
    ctx.fillText('High', legendX + legendWidth - 10, legendY + 55);
  };

  return (
    <div className="heatmap-container">
      {/* Header */}
      <div className="heatmap-header">
        <div className="heatmap-title">
          <div className="heatmap-icon">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2>{title}</h2>
            <p>User interaction density visualization</p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="heatmap-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="heatmap-canvas"
        />
      </div>

      {/* Legend Info */}
      <div className="heatmap-info">
        <div className="heatmap-info-item hot">
          <span className="info-dot"></span>
          <div>
            <strong>Hot Zones</strong>
            <p>High interaction - users rotate & zoom frequently</p>
          </div>
        </div>
        <div className="heatmap-info-item cold">
          <span className="info-dot"></span>
          <div>
            <strong>Cold Zones</strong>
            <p>Low interaction - passively viewed areas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

HeatmapViewer.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      intensity: PropTypes.number.isRequired,
      count: PropTypes.number,
    })
  ),
  title: PropTypes.string,
};

export default HeatmapViewer;
