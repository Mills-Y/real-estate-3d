# Frontend-Backend Integration Guide

This document explains how to integrate the React frontend with the Express backend API.

## 🔌 API Service Layer

Create a new service file to handle API calls: [src/services/apiService.js](../src/services/apiService.js)

```javascript
// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Error handling utility
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  return data;
};

// ============================================================================
// MODELS API
// ============================================================================

/**
 * Fetch all models with optional filters
 */
export const fetchModels = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/models?${params}`);
  return handleResponse(response);
};

/**
 * Fetch a single model by ID
 */
export const fetchModel = async (id) => {
  const response = await fetch(`${API_BASE_URL}/models/${id}`);
  return handleResponse(response);
};

/**
 * Update model metadata
 */
export const updateModel = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/models/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

/**
 * Delete a model
 */
export const deleteModel = async (id) => {
  const response = await fetch(`${API_BASE_URL}/models/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(response);
};

/**
 * Increment model view count
 */
export const incrementModelViews = async (id) => {
  const response = await fetch(`${API_BASE_URL}/models/${id}/views`, {
    method: 'POST'
  });
  return handleResponse(response);
};

/**
 * Get statistics summary
 */
export const getStatsSummary = async () => {
  const response = await fetch(`${API_BASE_URL}/models/stats/summary`);
  return handleResponse(response);
};

// ============================================================================
// UPLOAD API
// ============================================================================

/**
 * Upload a 3D model file
 */
export const uploadModel = async (formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
        } else {
          reject(new Error(response.error || `HTTP ${xhr.status}`));
        }
      } catch (error) {
        reject(error);
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', `${API_BASE_URL}/upload`);
    xhr.send(formData);
  });
};

/**
 * Validate upload requirements
 */
export const validateUpload = async () => {
  const response = await fetch(`${API_BASE_URL}/upload/validate`);
  return handleResponse(response);
};
```

## 🔧 Environment Configuration

Create `.env` file in the frontend root directory:

```env
# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NODE_ENV=development

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_3D_VIEWER=true
REACT_APP_ENABLE_UPLOADS=true
```

## 📝 Component Integration Examples

### PropertyGallery Component

Update [src/components/features/Gallery/PropertyGallery.jsx](../src/components/features/Gallery/PropertyGallery.jsx):

```javascript
import { useEffect, useState } from 'react';
import { fetchModels } from '../../../services/apiService';

export default function PropertyGallery() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const result = await fetchModels();
        setProperties(result.data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error loading properties:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  if (loading) return <div>Loading properties...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="gallery">
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

### Upload Component

Create a new upload component:

```javascript
import { useState } from 'react';
import { uploadModel, validateUpload } from '../../../services/apiService';

export default function UploadForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    price: '',
    type: 'Residential'
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!formData.title || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const data = new FormData();
      data.append('file', file);
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      const result = await uploadModel(data, setProgress);
      
      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        address: '',
        price: '',
        type: 'Residential'
      });
      setFile(null);

      console.log('Model uploaded:', result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="title"
        placeholder="Property Title"
        value={formData.title}
        onChange={handleInputChange}
        required
      />
      
      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleInputChange}
      />

      <input
        type="text"
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleInputChange}
        required
      />

      <input
        type="number"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleInputChange}
      />

      <select
        name="type"
        value={formData.type}
        onChange={handleInputChange}
      >
        <option value="Residential">Residential</option>
        <option value="Commercial">Commercial</option>
      </select>

      <input
        type="file"
        onChange={handleFileChange}
        accept=".glb,.gltf,.ply,.obj,.fbx"
        required
      />

      {uploading && <progress value={progress} max={100} />}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Model uploaded successfully!</p>}

      <button type="submit" disabled={uploading}>
        {uploading ? `Uploading ${Math.round(progress)}%` : 'Upload Model'}
      </button>
    </form>
  );
}
```

## 🎯 Model Viewer Integration

Update [src/components/features/Viewer/ModelViewer.jsx](../src/components/features/Viewer/ModelViewer.jsx) to load from API:

```javascript
import { useEffect } from 'react';
import { incrementModelViews } from '../../../services/apiService';

export default function ModelViewer({ modelId, propertyData }) {
  useEffect(() => {
    // Track view when model opens
    if (modelId) {
      incrementModelViews(modelId).catch(console.error);
    }
  }, [modelId]);

  // Use propertyData.modelPath from API
  const modelPath = propertyData?.modelPath;

  return (
    <div>
      {/* Babylon.js or Three.js viewer */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

## 📊 Analytics Integration with Backend

The analytics system now tracks events and can sync with the backend:

```javascript
// In analyticsService.js - Add sync to backend capability
export const syncAnalyticsToBackend = async () => {
  try {
    const events = window.storage.get('analyticsBuffer', []);
    
    const response = await fetch(`${API_BASE_URL}/analytics/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });

    if (response.ok) {
      window.storage.delete('analyticsBuffer');
      console.log('📊 Analytics synced to backend');
    }
  } catch (error) {
    console.error('Failed to sync analytics:', error);
  }
};
```

## 🔄 Running Frontend & Backend Together

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 2 - Frontend
```bash
npm install
npm start
```

Both will run on:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

## 🌐 Production Deployment

### Update Environment Variables

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_NODE_ENV=production
```

### Backend Production URL
```env
CORS_ORIGIN=https://yourdomain.com
PORT=5000
NODE_ENV=production
```

---

**Integration Status:** ✅ Ready for implementation  
**Last Updated:** December 17, 2025
