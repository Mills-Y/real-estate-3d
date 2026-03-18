import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Camera, Grid3x3, Upload, RefreshCw, Lock, Globe, Smartphone } from 'lucide-react';
import PropertyCard from './PropertyCard';
import ARModelViewer from '../AR/ARModelViewer';
import { trackEvent } from '../../../services/analyticsService';
import { fetchModels, fetchMyModels, getModelURL } from '../../../services/apiService';
import { preloadModelThumbnails } from '../../../services/thumbnailPreloader';
import { useAuth } from '../../../contexts/AuthContext';

const PropertyGallery = ({ properties: initialProperties, refreshKey, activeTab, onTabChange, onViewProperty, onDeleteProperty }) => {
  const [properties, setProperties] = useState(initialProperties);
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // AR Viewer state
  const [showARViewer, setShowARViewer] = useState(false);
  const [selectedARProperty, setSelectedARProperty] = useState(null);

  // Load properties from backend API
  useEffect(() => {
    loadPropertiesFromAPI();
  }, []);

  // Load my models when user logs in or tab changes to myuploads
  useEffect(() => {
    if (activeTab === 'myuploads' && user) {
      loadMyModelsFromAPI();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (!refreshKey) return;

    if (activeTab === 'myuploads' && user) {
      loadMyModelsFromAPI();
      return;
    }

    loadPropertiesFromAPI();
  }, [refreshKey, activeTab, user]);

  const convertModelToProperty = (model) => {
    const modelUrl = getModelURL(model.modelPath || '');
    
    const fileName = model.modelFile || model.modelPath || '';
    const fileType = fileName.toLowerCase().endsWith('.ply') ? 'ply' : 'gltf';
    
    let thumbnailUrl = model.thumbnail;
    if (thumbnailUrl) {
      thumbnailUrl = getModelURL(thumbnailUrl);
    }
    
    return {
      id: model.id,
      title: model.title,
      description: model.description,
      location: model.address,
      address: model.address,
      price: model.price,
      type: 'upload',
      beds: model.bedrooms,
      bedrooms: model.bedrooms,
      baths: model.bathrooms,
      bathrooms: model.bathrooms,
      sqft: model.sqft,
      modelFile: model.modelFile,
      modelPath: model.modelPath,
      modelUrl: modelUrl,
      fileType: fileType,
      image: thumbnailUrl,
      thumbnail: thumbnailUrl,
      uploadedAt: model.uploadedAt,
      views: model.views,
      engagementScore: model.engagementScore,
      uploadedBy: model.uploadedBy || null,
      userId: model.userId,
      isPublic: model.isPublic !== false // Default to true for backward compatibility
    };
  };

  const loadPropertiesFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchModels();
      
      const apiProperties = result.data?.map(convertModelToProperty) || [];
      
      console.log('✅ Loaded public properties from API:', apiProperties.length);
      setProperties(apiProperties);
      
      // Automatically preload thumbnails
      await preloadModelThumbnails(apiProperties, 3);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError(err.message);
      setProperties(initialProperties);
    } finally {
      setLoading(false);
    }
  };

  const loadMyModelsFromAPI = async () => {
    if (!user) {
      setMyProperties([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchMyModels();
      
      const myApiProperties = result.data?.map(convertModelToProperty) || [];
      
      console.log('✅ Loaded my models from API:', myApiProperties.length);
      setMyProperties(myApiProperties);
      
      // Preload thumbnails for my models
      await preloadModelThumbnails(myApiProperties, 3);
    } catch (err) {
      console.error('Error loading my models:', err);
      setError(err.message);
      setMyProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (activeTab === 'myuploads' && user) {
      await loadMyModelsFromAPI();
    } else {
      await loadPropertiesFromAPI();
    }
  };

  // Handle AR view
  const handleViewAR = (property) => {
    setSelectedARProperty(property);
    setShowARViewer(true);
    trackEvent('ar_viewer_opened', {
      propertyId: property.id,
      propertyTitle: property.title,
      timestamp: new Date().toISOString(),
    });
    console.log('📊 Analytics: AR viewer opened for', property.title);
  };

  // Track gallery view on mount
  useEffect(() => {
    trackEvent('gallery_opened', {
      totalProperties: properties.length,
      scannedCount: properties.filter(p => p.type === 'scan').length,
      uploadedCount: properties.filter(p => p.type === 'upload').length,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Track tab navigation
  const handleTabChange = (tab) => {
    // If switching to myuploads but not logged in, show message
    if (tab === 'myuploads' && !user) {
      alert('Please log in to view your uploads');
      return;
    }

    trackEvent('gallery_tab_changed', {
      activeTab: tab,
      totalProperties: properties.length,
      timestamp: new Date().toISOString(),
    });
    console.log(`📊 Analytics: Gallery tab changed to ${tab}`);
    onTabChange(tab);
  };

  // Get the right properties based on active tab
  const getDisplayProperties = () => {
    if (activeTab === 'myuploads') {
      return myProperties;
    }
    return properties;
  };

  const displayProperties = getDisplayProperties();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      gap: '2rem',
    }}>
      {/* Stats/Hero Section - Centered */}
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1.5rem',
          borderRadius: '1rem',
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          textAlign: 'center',
        }}>
          <div>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem 0',
            }}>
              {activeTab === 'myuploads' ? 'My Property Portfolio' : 'Public Property Gallery'}
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              {activeTab === 'myuploads' 
                ? 'Manage your 3D property scans' 
                : 'Browse publicly shared 3D property scans'}
            </p>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}>
            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh from backend"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#60a5fa' }}>
                {activeTab === 'myuploads' ? myProperties.length : properties.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                {activeTab === 'myuploads' ? 'My Models' : 'Public Models'}
              </div>
            </div>
            {activeTab === 'myuploads' && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#10b981' }}>
                    {myProperties.filter(p => p.isPublic).length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                    <Globe size={14} /> Public
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    {myProperties.filter(p => !p.isPublic).length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                    <Lock size={14} /> Private
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {error && (
          <div style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>
            ⚠️ Error loading properties: {error}
          </div>
        )}
        {loading && (
          <div style={{ color: '#94a3b8', marginTop: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>
            Loading from backend...
          </div>
        )}
      </div>

      {/* Tabs - Centered */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}>
        <button
          onClick={() => handleTabChange('gallery')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 300ms',
            background:
              activeTab === 'gallery'
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'rgba(30, 41, 59, 0.5)',
            color: activeTab === 'gallery' ? 'white' : '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(12px)',
            boxShadow:
              activeTab === 'gallery' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none',
            cursor: 'pointer',
            minHeight: '44px',
          }}
          onMouseEnter={(e) => activeTab !== 'gallery' && (e.target.style.background = 'rgba(30, 41, 59, 0.7)')}
          onMouseLeave={(e) => activeTab !== 'gallery' && (e.target.style.background = 'rgba(30, 41, 59, 0.5)')}
        >
          <Grid3x3 size={20} />
          Public Gallery
        </button>
        <button
          onClick={() => handleTabChange('myuploads')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 300ms',
            background:
              activeTab === 'myuploads'
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'rgba(30, 41, 59, 0.5)',
            color: activeTab === 'myuploads' ? 'white' : '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(12px)',
            boxShadow:
              activeTab === 'myuploads' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none',
            cursor: 'pointer',
            minHeight: '44px',
            opacity: user ? 1 : 0.6,
          }}
          onMouseEnter={(e) => activeTab !== 'myuploads' && (e.target.style.background = 'rgba(30, 41, 59, 0.7)')}
          onMouseLeave={(e) => activeTab !== 'myuploads' && (e.target.style.background = 'rgba(30, 41, 59, 0.5)')}
        >
          <Upload size={20} />
          My Uploads
          {!user && <Lock size={14} />}
        </button>
      </div>

      {/* Property Grid - Centered with responsive columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1rem',
        justifyItems: 'center',
      }}>
        {displayProperties.map((property) => (
          <div key={property.id} style={{ width: '100%', maxWidth: '350px', position: 'relative' }}>
            {/* Privacy indicator for My Uploads tab */}
            {activeTab === 'myuploads' && (
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                zIndex: 10,
                background: property.isPublic ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                {property.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                {property.isPublic ? 'Public' : 'Private'}
              </div>
            )}
            
            {/* AR Button - Shows on all cards */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewAR(property);
              }}
              style={{
                position: 'absolute',
                top: activeTab === 'myuploads' ? '2.5rem' : '0.5rem',
                right: '0.5rem',
                zIndex: 10,
                background: 'rgba(139, 92, 246, 0.9)',
                color: 'white',
                padding: '0.375rem 0.625rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.4)';
              }}
              title="View in AR (mobile) or 3D"
            >
              <Smartphone size={14} />
              AR
            </button>

            <PropertyCard
              property={property}
              onView={onViewProperty}
              onDelete={onDeleteProperty}
            />
          </div>
        ))}
      </div>

      {displayProperties.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 1rem',
          textAlign: 'center',
          width: '100%',
        }}>
          <Camera size={80} style={{ color: '#4b5563', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9ca3af', marginBottom: '0.5rem' }}>
            {activeTab === 'myuploads' ? 'No Uploads Yet' : 'No Public Properties'}
          </h3>
          <p style={{ color: '#6b7280' }}>
            {activeTab === 'myuploads' 
              ? 'Upload your first 3D model to get started'
              : 'No public properties available yet'}
          </p>
        </div>
      )}

      {/* AR Model Viewer Modal */}
      <ARModelViewer
        isOpen={showARViewer}
        property={selectedARProperty}
        onClose={() => {
          setShowARViewer(false);
          setSelectedARProperty(null);
        }}
      />
    </div>
  );
};

PropertyGallery.propTypes = {
  properties: PropTypes.arrayOf(PropTypes.object).isRequired,
  refreshKey: PropTypes.number,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  onViewProperty: PropTypes.func.isRequired,
  onDeleteProperty: PropTypes.func.isRequired,
};

PropertyGallery.defaultProps = {
  refreshKey: 0,
};

export default PropertyGallery;
