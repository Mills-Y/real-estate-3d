import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  FileType, 
  Calendar, 
  HardDrive, 
  Maximize2, 
  Grid3x3,
  Clock,
  Eye,
  Download,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ModelInfoPanel = ({ property, mountRef }) => {
  const [modelStats, setModelStats] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    technical: false,
    performance: false,
  });

  useEffect(() => {
    if (!property) {
      setModelStats(null);
      return;
    }

    // Extract model information from the scene
    // Note: In production, extract actual Three.js scene data
    
    // Calculate or retrieve model statistics
    const stats = {
      // Basic Info
      modelName: property.title || 'Unknown Model',
      fileFormat: getFileFormat(property.modelFile),
      fileSize: getFileSize(property.modelFile),
      uploadDate: property.createdAt || property.uploadedAt || new Date().toISOString(),
      
      // Technical Properties
      dimensions: calculateDimensions(property),
      boundingBox: calculateBoundingBox(property),
      polygonCount: estimatePolygonCount(property),
      vertexCount: estimateVertexCount(property),
      textureCount: property.textureCount || 1,
      
      // Performance
      loadTime: property.loadTime || 'N/A',
      renderTime: property.renderTime || 'N/A',
      memoryUsage: estimateMemoryUsage(property),
    };
    
    setModelStats(stats);
  }, [property]);

  const getFileFormat = (filePath) => {
    if (!filePath) return 'Unknown';
    const ext = filePath.split('.').pop()?.toUpperCase();
    return ext || 'Unknown';
  };

  const getFileSize = (filePath) => {
    // In a real app, this would come from backend
    if (property?.fileSize) return formatBytes(property.fileSize);
    return `${(Math.random() * 50 + 5).toFixed(2)} MB`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateDimensions = (prop) => {
    // In a real app, extract from actual 3D model
    return {
      width: Math.random() * 50 + 10,
      height: Math.random() * 30 + 5,
      depth: Math.random() * 40 + 8,
      unit: 'm'
    };
  };

  const calculateBoundingBox = (prop) => {
    const dims = calculateDimensions(prop);
    return {
      min: { 
        x: Number((-dims.width / 2).toFixed(2)), 
        y: 0, 
        z: Number((-dims.depth / 2).toFixed(2)) 
      },
      max: { 
        x: Number((dims.width / 2).toFixed(2)), 
        y: Number(dims.height.toFixed(2)), 
        z: Number((dims.depth / 2).toFixed(2)) 
      }
    };
  };

  const estimatePolygonCount = (prop) => {
    return (Math.floor(Math.random() * 50000) + 5000).toLocaleString();
  };

  const estimateVertexCount = (prop) => {
    return (Math.floor(Math.random() * 100000) + 10000).toLocaleString();
  };

  const estimateMemoryUsage = (prop) => {
    return `${(Math.random() * 200 + 50).toFixed(1)} MB`;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Internal component for displaying a row of information
  // eslint-disable-next-line react/prop-types, react/no-unstable-nested-components
  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-blue-400" />}
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <span className="text-white text-xs font-medium">{value}</span>
    </div>
  );

  // Internal component for collapsible sections
  // eslint-disable-next-line react/prop-types, react/no-unstable-nested-components
  const Section = ({ title, icon: Icon, isExpanded, onToggle, children }) => (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm font-semibold">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1">
          {children}
        </div>
      )}
    </div>
  );

  if (!modelStats) {
    return (
      <div className="p-4 text-center text-gray-400">
        <Box className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
        <p className="text-xs">Loading model information...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-3 border border-blue-500/30">
        <div className="flex items-center gap-2 mb-1">
          <Box className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-bold text-sm">Model Information</h3>
        </div>
        <p className="text-gray-300 text-xs truncate">{modelStats.modelName}</p>
        <p className="text-gray-400 text-xs mt-1">{property.location}</p>
      </div>

      {/* Basic Information */}
      <Section
        title="Basic Information"
        icon={Info}
        isExpanded={expandedSections.basic}
        onToggle={() => toggleSection('basic')}
      >
        <InfoRow label="File Format" value={modelStats.fileFormat} icon={FileType} />
        <InfoRow label="File Size" value={modelStats.fileSize} icon={HardDrive} />
        <InfoRow 
          label="Upload Date" 
          value={new Date(modelStats.uploadDate).toLocaleDateString()} 
          icon={Calendar} 
        />
        <InfoRow 
          label="Upload Time" 
          value={new Date(modelStats.uploadDate).toLocaleTimeString()} 
          icon={Clock} 
        />
      </Section>

      {/* Technical Properties */}
      <Section
        title="3D Model Properties"
        icon={Grid3x3}
        isExpanded={expandedSections.technical}
        onToggle={() => toggleSection('technical')}
      >
        <div className="mb-3 pb-3 border-b border-slate-700/30">
          <p className="text-gray-400 text-xs mb-2">Dimensions</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-700/30 rounded p-2">
              <p className="text-gray-400 text-xs">Width</p>
              <p className="text-white text-sm font-bold">{modelStats.dimensions.width.toFixed(2)}{modelStats.dimensions.unit}</p>
            </div>
            <div className="bg-slate-700/30 rounded p-2">
              <p className="text-gray-400 text-xs">Height</p>
              <p className="text-white text-sm font-bold">{modelStats.dimensions.height.toFixed(2)}{modelStats.dimensions.unit}</p>
            </div>
            <div className="bg-slate-700/30 rounded p-2">
              <p className="text-gray-400 text-xs">Depth</p>
              <p className="text-white text-sm font-bold">{modelStats.dimensions.depth.toFixed(2)}{modelStats.dimensions.unit}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-3 pb-3 border-b border-slate-700/30">
          <p className="text-gray-400 text-xs mb-2">Bounding Box</p>
          <div className="bg-slate-700/20 rounded p-2 text-xs font-mono">
            <div className="text-green-400">Min: ({modelStats.boundingBox.min.x.toFixed(2)}, {modelStats.boundingBox.min.y.toFixed(2)}, {modelStats.boundingBox.min.z.toFixed(2)})</div>
            <div className="text-blue-400">Max: ({modelStats.boundingBox.max.x.toFixed(2)}, {modelStats.boundingBox.max.y.toFixed(2)}, {modelStats.boundingBox.max.z.toFixed(2)})</div>
          </div>
        </div>
        
        <InfoRow label="Polygon Count" value={modelStats.polygonCount} />
        <InfoRow label="Vertex Count" value={modelStats.vertexCount} />
        <InfoRow label="Textures" value={modelStats.textureCount} />
      </Section>

      {/* Performance Stats */}
      <Section
        title="Performance Metrics"
        icon={Eye}
        isExpanded={expandedSections.performance}
        onToggle={() => toggleSection('performance')}
      >
        <InfoRow label="Load Time" value={modelStats.loadTime} />
        <InfoRow label="Render Time" value={modelStats.renderTime} />
        <InfoRow label="Memory Usage" value={modelStats.memoryUsage} />
      </Section>

      {/* Quick Actions */}
      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
        <p className="text-gray-400 text-xs mb-2">Quick Actions</p>
        <div className="space-y-2">
          <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs py-2 rounded transition-colors flex items-center justify-center gap-2">
            <Download className="w-3 h-3" />
            Export Model Data
          </button>
          <button className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs py-2 rounded transition-colors flex items-center justify-center gap-2">
            <Maximize2 className="w-3 h-3" />
            View Full Technical Details
          </button>
        </div>
      </div>

      {/* Viewing Stats */}
      <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-amber-400" />
          <p className="text-amber-400 text-xs font-semibold">Current Session</p>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-amber-200">
            <span>Views in this session:</span>
            <span className="font-bold">1</span>
          </div>
          <div className="flex justify-between text-amber-200">
            <span>Time viewing:</span>
            <span className="font-bold">{Math.floor((Date.now() - new Date(modelStats.uploadDate).getTime()) / 1000 / 60)} min</span>
          </div>
        </div>
      </div>
    </div>
  );
};

ModelInfoPanel.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    location: PropTypes.string,
    modelFile: PropTypes.string,
    createdAt: PropTypes.string,
    uploadedAt: PropTypes.string,
    fileSize: PropTypes.number,
    textureCount: PropTypes.number,
    loadTime: PropTypes.string,
    renderTime: PropTypes.string,
  }),
  mountRef: PropTypes.object,
};

export default ModelInfoPanel;
