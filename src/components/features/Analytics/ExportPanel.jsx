/**
 * ExportPanel Component - Modern export tracking and management
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Download, FileJson, File, FileText, Clock, ChevronRight } from 'lucide-react';
import { getFormattedDateTime } from '../../../utils/analyticsHelpers';
import { downloadAnalyticsCSV, downloadAnalyticsJSON } from '../../../services/analyticsService';
import './ExportPanel.css';

const ExportPanel = ({ exportStats }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const formats = [
    {
      name: 'GLB',
      count: exportStats?.formatBreakdown?.glb || 0,
      icon: FileJson,
      gradient: 'gradient-blue',
      color: '#3b82f6',
    },
    {
      name: 'GLTF',
      count: exportStats?.formatBreakdown?.gltf || 0,
      icon: File,
      gradient: 'gradient-purple',
      color: '#8b5cf6',
    },
    {
      name: 'PLY',
      count: exportStats?.formatBreakdown?.ply || 0,
      icon: File,
      gradient: 'gradient-green',
      color: '#10b981',
    },
  ];

  const totalExports = exportStats?.totalExports || formats.reduce((acc, f) => acc + f.count, 0);

  const handleDownloadCSV = () => {
    setDownloadingFormat('csv');
    const timestamp = new Date().toISOString().split('T')[0];
    const success = downloadAnalyticsCSV(`analytics-${timestamp}.csv`);
    setTimeout(() => setDownloadingFormat(null), 1500);
    if (success) {
      console.log('CSV exported successfully');
    }
  };

  const handleDownloadJSON = () => {
    setDownloadingFormat('json');
    const timestamp = new Date().toISOString().split('T')[0];
    const success = downloadAnalyticsJSON(`analytics-${timestamp}.json`);
    setTimeout(() => setDownloadingFormat(null), 1500);
    if (success) {
      console.log('JSON exported successfully');
    }
  };

  return (
    <div className="export-panel">
      {/* Header */}
      <div className="export-header">
        <div className="export-title">
          <div className="export-icon">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2>Export Activity</h2>
            <p>Track your model exports and downloads</p>
          </div>
        </div>
        <div className="export-total">
          <span className="total-value">{totalExports}</span>
          <span className="total-label">Total Exports</span>
        </div>
      </div>

      {/* Format Cards */}
      <div className="format-grid">
        {formats.map((format) => {
          const Icon = format.icon;
          const percentage = totalExports > 0 ? ((format.count / totalExports) * 100).toFixed(0) : 0;

          return (
            <button
              key={format.name}
              onClick={() => setSelectedFormat(selectedFormat === format.name ? null : format.name)}
              className={`format-card ${format.gradient} ${selectedFormat === format.name ? 'selected' : ''}`}
            >
              <div className="format-card-header">
                <div className={`format-card-icon ${format.gradient}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="format-name">{format.name}</span>
              </div>
              <div className="format-count">{format.count}</div>
              <div className="format-bar">
                <div 
                  className="format-bar-fill"
                  style={{ 
                    width: `${percentage}%`,
                    background: format.color 
                  }}
                ></div>
              </div>
              <div className="format-percentage">{percentage}% of exports</div>
            </button>
          );
        })}
      </div>

      {/* Recent Exports */}
      <div className="exports-section">
        <div className="exports-section-header">
          <h3>Recent Exports</h3>
          <button className="view-all-btn">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="exports-list">
          {exportStats?.lastExports && exportStats.lastExports.length > 0 ? (
            exportStats.lastExports.slice(0, 5).map((exp, index) => (
              <div key={index} className="export-item">
                <div className="export-item-icon">
                  <File className="w-4 h-4" />
                </div>
                <div className="export-item-info">
                  <span className="export-item-name">{exp.modelName}</span>
                  <span className="export-item-meta">
                    {(exp.format || 'UNKNOWN').toUpperCase()} • {exp.size} MB
                  </span>
                </div>
                <div className="export-item-time">
                  <Clock className="w-3 h-3" />
                  <span>{getFormattedDateTime(exp.timestamp)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="exports-empty">
              <Download className="w-8 h-8" />
              <p>No exports yet</p>
              <span>Export a model to see it here</span>
            </div>
          )}
        </div>
      </div>

      {/* Download Reports */}
      <div className="download-section">
        <h3>Download Reports</h3>
        <div className="download-grid">
          <button
            onClick={handleDownloadCSV}
            disabled={downloadingFormat === 'csv'}
            className={`download-btn csv ${downloadingFormat === 'csv' ? 'downloading' : ''}`}
          >
            <FileText className="w-5 h-5" />
            <div className="download-btn-text">
              <span className="download-btn-title">
                {downloadingFormat === 'csv' ? 'Exporting...' : 'CSV Report'}
              </span>
              <span className="download-btn-desc">Spreadsheet format</span>
            </div>
            <Download className="w-4 h-4 download-arrow" />
          </button>

          <button
            onClick={handleDownloadJSON}
            disabled={downloadingFormat === 'json'}
            className={`download-btn json ${downloadingFormat === 'json' ? 'downloading' : ''}`}
          >
            <FileJson className="w-5 h-5" />
            <div className="download-btn-text">
              <span className="download-btn-title">
                {downloadingFormat === 'json' ? 'Exporting...' : 'JSON Report'}
              </span>
              <span className="download-btn-desc">Developer format</span>
            </div>
            <Download className="w-4 h-4 download-arrow" />
          </button>
        </div>
      </div>
    </div>
  );
};

ExportPanel.propTypes = {
  exportStats: PropTypes.shape({
    totalExports: PropTypes.number,
    formatBreakdown: PropTypes.shape({
      glb: PropTypes.number,
      gltf: PropTypes.number,
      ply: PropTypes.number,
    }),
    lastExports: PropTypes.arrayOf(PropTypes.object),
  }),
};

export default ExportPanel;
