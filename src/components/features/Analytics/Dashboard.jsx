import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  BarChart3, ArrowLeft, RefreshCw, ExternalLink, 
  TrendingUp, Eye, Activity, Users, Zap, Globe,
  ChevronRight
} from 'lucide-react';
import MetricsGrid from './MetricsGrid';
import EngagementChart from './EngagementChart';
import HeatmapViewer from './HeatmapViewer';
import RealTimeStats from './RealTimeStats';
import ExportPanel from './ExportPanel';
import { mockAnalyticsData } from '../../../data/mockAnalytics';
import { fetchRealAnalytics } from '../../../services/analyticsService';
import { getFileType } from '../../../utils/analyticsHelpers';
import './Dashboard.css';

const Dashboard = ({ onClose, isPanel = false, propertyId = null, property = null }) => {
  const [analyticsData, setAnalyticsData] = useState(mockAnalyticsData);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshAnalytics();
    const interval = setInterval(refreshAnalytics, 30000);
    return () => clearInterval(interval);
  }, [propertyId]);

  const refreshAnalytics = async () => {
    setIsRefreshing(true);
    
    try {
      const backendAnalytics = await fetchRealAnalytics();
      
      if (backendAnalytics) {
        const engagementByModel = (backendAnalytics.topModels || []).map(model => ({
          modelId: model.id,
          name: model.title,
          engagement: model.engagement || 0,
          interactions: model.scans || 0,
          views: model.views || 0,
        }));

        const recentUploads = (backendAnalytics.recentUploads || []).map(upload => {
          const fileType = upload.fileType || getFileType(upload.modelFile || '');
          const fileSizeNum = upload.fileSizeMB ? Number.parseFloat(upload.fileSizeMB) : 0;
          const sizeDisplay = !Number.isNaN(fileSizeNum) && fileSizeNum > 0 ? `${fileSizeNum.toFixed(2)}` : 'N/A';
          
          return {
            modelName: upload.title,
            format: fileType,
            timestamp: new Date(upload.uploadedAt),
            size: sizeDisplay,
            views: upload.views,
            scans: upload.scans
          };
        });

        const fileTypeBreakdown = {};
        Object.entries(backendAnalytics.fileTypeStats || {}).forEach(([type, stats]) => {
          fileTypeBreakdown[type.toLowerCase()] = stats.count;
        });

        setAnalyticsData(prevData => ({
          ...prevData,
          totalScans: backendAnalytics.totalScans || 0,
          activeModels: backendAnalytics.totalModels || 0,
          averageEngagement: Number.parseFloat(backendAnalytics.avgEngagement) || 0,
          monthlyGrowth: ((backendAnalytics.totalScans / Math.max(backendAnalytics.totalModels, 1)) * 10).toFixed(1),
          totalViews: backendAnalytics.totalViews || 0,
          engagementByModel: engagementByModel,
          exportStats: {
            ...prevData.exportStats,
            totalExports: recentUploads.length,
            lastExports: recentUploads,
            formatBreakdown: fileTypeBreakdown
          },
          realTimeStats: {
            usersOnline: backendAnalytics.totalModels,
            activeModels: backendAnalytics.totalModels,
            avgSessionTime: (backendAnalytics.averageViews / Math.max(backendAnalytics.totalModels, 1)).toFixed(1),
            peakHourViews: backendAnalytics.totalViews
          }
        }));
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
    
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const openCloudflareAnalytics = () => {
    window.open('https://dash.cloudflare.com/?to=/:account/web-analytics/sites/realestate3d-demo.com', '_blank');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: TrendingUp },
    { id: 'heatmap', label: 'Heatmap', icon: Zap },
    { id: 'exports', label: 'Exports', icon: Activity },
  ];

  // Panel Mode (sidebar)
  if (isPanel) {
    return (
      <div className="analytics-panel">
        {/* Header */}
        <div className="analytics-panel-header">
          <div className="analytics-panel-title">
            <div className="analytics-icon-wrapper">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2>Analytics</h2>
              <p>Real-time insights</p>
            </div>
          </div>
          <div className="analytics-panel-actions">
            <button
              onClick={refreshAnalytics}
              disabled={isRefreshing}
              className="analytics-icon-btn"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'spinning' : ''}`} />
            </button>
            <button onClick={onClose} className="analytics-icon-btn" title="Close panel">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cloudflare Link */}
        <button onClick={openCloudflareAnalytics} className="cloudflare-link-panel">
          <Globe className="w-4 h-4" />
          <span>Cloudflare Web Analytics</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        {/* Tabs */}
        <div className="analytics-tabs-panel">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`analytics-tab-panel ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="analytics-panel-content">
          {activeTab === 'overview' && (
            <>
              <MetricsGrid metrics={analyticsData} compact />
              <TopPropertiesPanel data={analyticsData.engagementByModel} />
            </>
          )}
          {activeTab === 'engagement' && (
            <div className="scaled-chart">
              <EngagementChart data={analyticsData.dailyMetrics} compact />
            </div>
          )}
          {activeTab === 'heatmap' && <HeatmapViewer data={analyticsData.heatmapData} />}
          {activeTab === 'exports' && <ExportPanel exportStats={analyticsData.exportStats} />}
        </div>
      </div>
    );
  }

  // Modal Mode (fullscreen)
  return (
    <div className="analytics-modal-overlay" onClick={onClose}>
      <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
        {/* Animated Background */}
        <div className="analytics-bg-effects">
          <div className="analytics-bg-gradient"></div>
          <div className="analytics-bg-grid"></div>
          <div className="analytics-bg-glow"></div>
        </div>

        {/* Header */}
        <header className="analytics-header">
          <div className="analytics-header-left">
            <div className="analytics-logo">
              <div className="analytics-logo-icon">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="analytics-logo-text">
                <h1>Analytics Dashboard</h1>
                <p>Real-time metrics & engagement insights</p>
              </div>
            </div>
          </div>

          <div className="analytics-header-right">
            {/* Cloudflare Button */}
            <button onClick={openCloudflareAnalytics} className="cloudflare-btn">
              <div className="cloudflare-btn-icon">
                <svg viewBox="0 0 65 27" fill="currentColor" className="w-5 h-5">
                  <path d="M54.2 13.5c-.1-4.1-3.4-7.4-7.6-7.4-2.4 0-4.6 1.1-6 2.9-.6-.2-1.2-.3-1.8-.3-3.4 0-6.2 2.5-6.7 5.8-2.4.4-4.1 2.5-4.1 5 0 2.8 2.3 5.1 5.1 5.1h20.3c2.1 0 3.8-1.7 3.8-3.8 0-2.7-1.7-5-4-5.3-.1-.7-.5-1.4-1-2z"/>
                </svg>
              </div>
              <span>Cloudflare Analytics</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={refreshAnalytics}
              disabled={isRefreshing}
              className="analytics-refresh-btn"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'spinning' : ''}`} />
            </button>

            <button onClick={onClose} className="analytics-close-btn">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="analytics-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`analytics-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {activeTab === tab.id && <div className="tab-indicator"></div>}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main className="analytics-content">
          {activeTab === 'overview' && (
            <div className="analytics-overview">
              <MetricsGrid metrics={analyticsData} />
              <RealTimeStats data={analyticsData.realTimeStats} />
              <TopPropertiesCard data={analyticsData.engagementByModel} />
            </div>
          )}

          {activeTab === 'engagement' && (
            <EngagementChart data={analyticsData.dailyMetrics} />
          )}

          {activeTab === 'heatmap' && (
            <HeatmapViewer data={analyticsData.heatmapData} />
          )}

          {activeTab === 'exports' && (
            <ExportPanel exportStats={analyticsData.exportStats} />
          )}
        </main>
      </div>
    </div>
  );
};

// Top Properties Panel (for sidebar)
const TopPropertiesPanel = ({ data }) => (
  <div className="top-properties-panel">
    <h3>Top Properties</h3>
    <div className="properties-list">
      {data && data.length > 0 ? (
        data.slice(0, 5).map((model, index) => (
          <div key={index} className="property-item">
            <div className="property-rank">{index + 1}</div>
            <div className="property-info">
              <p className="property-name">{model.name}</p>
              <p className="property-views">{model.views} views</p>
            </div>
            <div className="property-engagement">
              <span className="engagement-value">{model.engagement}%</span>
              <div className="engagement-bar">
                <div className="engagement-fill" style={{ width: `${model.engagement}%` }}></div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="no-data">No data yet</p>
      )}
    </div>
  </div>
);

// Top Properties Card (for modal)
const TopPropertiesCard = ({ data }) => (
  <div className="top-properties-card">
    <div className="card-header">
      <h2>Top Properties by Engagement</h2>
      <button className="view-all-btn">
        View All <ChevronRight className="w-4 h-4" />
      </button>
    </div>
    <div className="properties-grid">
      {data && data.length > 0 ? (
        data.map((model, index) => (
          <div key={index} className="property-card">
            <div className="property-card-header">
              <div className="property-card-rank">#{index + 1}</div>
              <div className="property-card-engagement">{model.engagement}%</div>
            </div>
            <h3 className="property-card-name">{model.name}</h3>
            <div className="property-card-stats">
              <span><Eye className="w-3 h-3" /> {model.views}</span>
              <span><Activity className="w-3 h-3" /> {model.interactions}</span>
            </div>
            <div className="property-card-bar">
              <div className="property-card-fill" style={{ width: `${model.engagement}%` }}></div>
            </div>
          </div>
        ))
      ) : (
        <p className="no-data">No engagement data yet. Start viewing properties to see analytics!</p>
      )}
    </div>
  </div>
);

TopPropertiesPanel.propTypes = {
  data: PropTypes.array,
};

TopPropertiesCard.propTypes = {
  data: PropTypes.array,
};

Dashboard.propTypes = {
  onClose: PropTypes.func.isRequired,
  isPanel: PropTypes.bool,
  propertyId: PropTypes.string,
  property: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    location: PropTypes.string,
  }),
};

export default Dashboard;
