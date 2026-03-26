import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const SettingsModal = ({ isOpen, apiKey, onApiKeyChange, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl"
        style={{ margin: 'auto', color: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>
            Kiri Engine Settings
          </h2>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 rounded-full p-2"
            style={{ minWidth: '44px', minHeight: '44px', color: '#ffffff' }}
            title="Close settings"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold" style={{ color: '#ffffff' }}>
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Enter your Kiri Engine API key"
            className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            style={{ color: '#ffffff' }}
          />
          <p className="text-sm mt-2" style={{ color: '#e5e5e5' }}>
            Get your API key from{' '}
            <a
              href="https://www.kiriengine.app/api"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
              style={{ color: '#c084fc' }}
            >
              kiriengine.app/api
            </a>
          </p>
        </div>

        <div className="bg-purple-900 bg-opacity-40 border border-purple-600 rounded-lg p-4 mb-4">
          <p className="text-sm" style={{ color: '#ffffff' }}>
            💡 <strong>About Kiri Engine:</strong> Professional 3D scanning service using
            photogrammetry. Sign up to get 20 free credits!
          </p>
        </div>

        <div className="bg-blue-900 bg-opacity-40 border border-blue-600 rounded-lg p-4">
          <p className="text-sm font-semibold mb-2" style={{ color: '#ffffff' }}>
            How it works:
          </p>
          <ul className="text-sm space-y-1" style={{ color: '#f5f5f5' }}>
            <li>• Capture 20+ photos of your property</li>
            <li>• Click "Process with Kiri Engine"</li>
            <li>• Wait 5-10 minutes for processing</li>
            <li>• Download your 3D model automatically!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  apiKey: PropTypes.string.isRequired,
  onApiKeyChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SettingsModal;
