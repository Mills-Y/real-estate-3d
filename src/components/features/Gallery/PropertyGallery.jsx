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
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [loadingMy, setLoadingMy] = useState(false);
  const [publicError, setPublicError] = useState(null);
  const [myError, setMyError] = useState(null);
  const { user } = useAuth();

  // AR Viewer state
  const [showARViewer, setShowARViewer] = useState(false);
  const [selectedARProperty, setSelectedARProperty] = useState(null);

  // Load properties from backend API
  useEffect(() => {
    loadPropertiesFromAPI();
    if (user) {
      loadMyModelsFromAPI();
    }
  }, []);

  // Load my models when user logs in
  useEffect(() => {
    if (user) {
      loadMyModelsFromAPI();
    } else {
      setMyProperties([]);
    }
  }, [user]);

  useEffect(() => {
    if (!refreshKey) return;

    loadPropertiesFromAPI();
    if (user) {
      loadMyModelsFromAPI();
    }
  }, [refreshKey, user]);

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
      setLoadingPublic(true);
      setPublicError(null);
      const result = await fetchModels();
      
      const apiProperties = result.data?.map(convertModelToProperty) || [];
      
      console.log('✅ Loaded public properties from API:', apiProperties.length);
      setProperties(apiProperties);
      
      // Automatically preload thumbnails
      await preloadModelThumbnails(apiProperties, 3);
    } catch (err) {
      console.error('Error loading properties:', err);
      setPublicError(err.message);
      setProperties(initialProperties);
    } finally {
      setLoadingPublic(false);
    }
  };

  const loadMyModelsFromAPI = async () => {
    if (!user) {
      setMyProperties([]);
      return;
    }

    try {
      setLoadingMy(true);
      setMyError(null);
      const result = await fetchMyModels();
      
      const myApiProperties = result.data?.map(convertModelToProperty) || [];
      
      console.log('✅ Loaded my models from API:', myApiProperties.length);
      setMyProperties(myApiProperties);
      
      // Preload thumbnails for my models
      await preloadModelThumbnails(myApiProperties, 3);
    } catch (err) {
      console.error('Error loading my models:', err);
      setMyError(err.message);
      setMyProperties([]);
    } finally {
      setLoadingMy(false);
    }
  };

  const handleRefreshPublic = async () => {
    await loadPropertiesFromAPI();
  };

  const handleRefreshMy = async () => {
    if (!user) return;
    await loadMyModelsFromAPI();
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

  // Keep this for analytics compatibility with existing activeTab tracking
  const handleSectionFocus = (tab) => {
    trackEvent('gallery_tab_changed', {
      activeTab: tab,
      totalProperties: properties.length,
      timestamp: new Date().toISOString(),
    });
    console.log(`📊 Analytics: Gallery section focused: ${tab}`);
    onTabChange(tab);
  };

  const renderPropertyGrid = (sectionProperties, showDelete, tabKey) => (
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
      {sectionProperties.map((property) => (
        <div key={`${tabKey}-${property.id}`} style={{ width: '100%', maxWidth: '350px', position: 'relative' }}>
          {tabKey === 'myuploads' && (
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewAR(property);
            }}
            style={{
              position: 'absolute',
              top: tabKey === 'myuploads' ? '2.5rem' : '0.5rem',
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
            onDelete={() => onDeleteProperty(property.id)}
            showDelete={showDelete}
          />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = (title, subtitle) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1rem',
      textAlign: 'center',
      width: '100%',
    }}>
      <Camera size={64} style={{ color: '#4b5563', marginBottom: '1rem' }} />
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#9ca3af', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ color: '#6b7280', margin: 0 }}>{subtitle}</p>
    </div>
  );

  const myPrivateProperties = myProperties.filter((property) => !property.isPublic);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      width: '100%',
      gap: '2rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => handleSectionFocus('gallery')}
          style={{
            padding: '0.7rem 1.1rem',
            borderRadius: '0.7rem',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            background: activeTab === 'gallery' ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'rgba(30, 41, 59, 0.65)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '700',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Grid3x3 size={18} /> Public Gallery
        </button>
        <button
          onClick={() => user && handleSectionFocus('myuploads')}
          disabled={!user}
          style={{
            padding: '0.7rem 1.1rem',
            borderRadius: '0.7rem',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background: activeTab === 'myuploads' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'rgba(15, 23, 42, 0.65)',
            color: '#fff',
            cursor: user ? 'pointer' : 'not-allowed',
            opacity: user ? 1 : 0.6,
            fontWeight: '700',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Upload size={18} /> My Uploads {!user && <Lock size={14} />}
        </button>
      </div>

      {activeTab === 'gallery' && (
        <section
          style={{
            width: '100%',
            padding: '1.5rem',
            borderRadius: '1rem',
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59, 130, 246, 0.45)',
            boxShadow: '0 12px 36px rgba(59, 130, 246, 0.14)',
          }}
        >
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
          }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Grid3x3 size={22} /> Public Gallery
              </h2>
              <p style={{ color: '#94a3b8', margin: '0.4rem 0 0 0' }}>
                Browse publicly shared 3D property models.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleRefreshPublic}
                disabled={loadingPublic}
                title="Refresh public gallery"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  cursor: loadingPublic ? 'not-allowed' : 'pointer',
                  opacity: loadingPublic ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
              >
                <RefreshCw size={18} style={{ animation: loadingPublic ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <div style={{ textAlign: 'center', minWidth: '90px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa', lineHeight: 1 }}>
                  {properties.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Public Models
                </div>
              </div>
            </div>
          </div>

          {publicError && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Error loading public gallery: {publicError}
            </div>
          )}
          {loadingPublic && (
            <div style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Loading public models...
            </div>
          )}

          {properties.length > 0
            ? renderPropertyGrid(properties, false, 'gallery')
            : renderEmptyState('No Public Properties', 'No public properties available yet.')}
        </section>
      )}

      {activeTab === 'myuploads' && (
        <section
          style={{
            width: '100%',
            padding: '1.5rem',
            borderRadius: '1rem',
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            boxShadow: '0 12px 36px rgba(16, 185, 129, 0.14)',
          }}
        >
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
          }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={22} /> My Uploads
              </h2>
              <p style={{ color: '#94a3b8', margin: '0.4rem 0 0 0' }}>
                Your uploaded models, including private content and visibility state.
              </p>
            </div>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleRefreshMy}
                  disabled={loadingMy}
                  title="Refresh my uploads"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    cursor: loadingMy ? 'not-allowed' : 'pointer',
                    opacity: loadingMy ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '44px',
                    minHeight: '44px',
                  }}
                >
                  <RefreshCw size={18} style={{ animation: loadingMy ? 'spin 1s linear infinite' : 'none' }} />
                </button>
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6ee7b7', lineHeight: 1 }}>
                    {myPrivateProperties.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Visible
                  </div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', lineHeight: 1 }}>
                    {myProperties.filter(p => p.isPublic).length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                    <Globe size={12} /> Public
                  </div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', lineHeight: 1 }}>
                    {myProperties.filter(p => !p.isPublic).length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                    <Lock size={12} /> Private
                  </div>
                </div>
              </div>
            )}
          </div>

          {!user && renderEmptyState('Login Required', 'Sign in to view and manage your uploads.')}

          {user && myError && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Error loading your uploads: {myError}
            </div>
          )}
          {user && loadingMy && (
            <div style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Loading your uploads...
            </div>
          )}

          {user && myPrivateProperties.length > 0 && renderPropertyGrid(myPrivateProperties, true, 'myuploads')}
          {user && myPrivateProperties.length === 0 && renderEmptyState('No Private Uploads', 'Public models are hidden in My Uploads. Upload or set a model to private.')}
        </section>
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
