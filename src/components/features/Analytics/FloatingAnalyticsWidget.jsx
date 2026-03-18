import React, { useState } from 'react';
import { ChevronUp, ChevronDown, BarChart3, X } from 'lucide-react';
import PropertyAnalyticsPanel from './PropertyAnalyticsPanel';

const FloatingAnalyticsWidget = ({ property, position = 'bottom-right', isMinimized = false, onClose = null }) => {
  const [minimized, setMinimized] = useState(isMinimized);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ${positionClasses[position]} max-w-sm`}
      style={{
        position: 'fixed',
        ...{
          'bottom-right': { bottom: '1rem', right: '1rem' },
          'bottom-left': { bottom: '1rem', left: '1rem' },
          'top-right': { top: '1rem', right: '1rem' },
          'top-left': { top: '1rem', left: '1rem' },
        }[position],
      }}
    >
      {/* Widget Container */}
      <div
        className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-slate-700 shadow-2xl overflow-hidden"
        style={{
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
          width: minimized ? '300px' : '350px',
          maxHeight: minimized ? '56px' : '500px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-600/20">
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-white font-semibold text-sm">Analytics</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1 rounded hover:bg-slate-700/50 text-gray-400 hover:text-white transition-colors"
              title={minimized ? 'Expand' : 'Minimize'}
            >
              {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {!minimized && (
          <div className="p-3 overflow-y-auto" style={{ maxHeight: '444px' }}>
            <PropertyAnalyticsPanel property={property} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingAnalyticsWidget;
