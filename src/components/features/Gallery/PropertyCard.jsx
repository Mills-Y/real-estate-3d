import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, Trash2, Share2, Package, Loader } from 'lucide-react';
import { trackEvent } from '../../../services/analyticsService';
import { getCachedThumbnail, getOrGenerateThumbnail } from '../../../services/thumbnailPreloader';

const PropertyCard = ({ property, onView, onDelete, showDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(true);
  
  // Use cached or generate thumbnail
  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        setIsLoadingThumbnail(true);
        
        // First, check if it's already cached from the gallery preloader
        let thumbnail = getCachedThumbnail(property.id);
        
        if (!thumbnail) {
          // If not cached, generate it now (for new uploads or missed models)
          console.log(`🎨 Generating thumbnail for: ${property.title}`);
          thumbnail = await getOrGenerateThumbnail(property);
        } else {
          console.log(`📦 Using cached thumbnail for: ${property.title}`);
        }
        
        setGeneratedThumbnail(thumbnail);
      } catch (error) {
        console.error('Thumbnail loading error:', error);
        setGeneratedThumbnail(null);
      } finally {
        setIsLoadingThumbnail(false);
      }
    };
    
    loadThumbnail();
  }, [property.id, property.title, property.modelUrl]);
  
  // Track card view on mount (impression)
  useEffect(() => {
    trackEvent('property_card_viewed', {
      propertyId: property.id,
      propertyTitle: property.title,
      propertyType: property.type,
      timestamp: new Date().toISOString(),
    });
    console.log(`📊 Analytics: Property card impression - ${property.title}`);
  }, [property.id, property.title, property.type]);

  // Handle view click with tracking
  const handleView = () => {
    trackEvent('property_card_clicked', {
      propertyId: property.id,
      propertyTitle: property.title,
      action: 'view',
      timestamp: new Date().toISOString(),
    });
    console.log(`📊 Analytics: Property card clicked - ${property.title}`);
    onView(property);
  };

  // Handle delete click with tracking
  const handleDelete = () => {
    trackEvent('property_card_deleted', {
      propertyId: property.id,
      propertyTitle: property.title,
      action: 'delete',
      timestamp: new Date().toISOString(),
    });
    onDelete(property);
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      role="article"
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
        {isLoadingThumbnail ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-xs text-slate-400">Loading...</span>
          </div>
        ) : generatedThumbnail && !imageError ? (
          <img
            src={generatedThumbnail}
            alt={property.title}
            className="w-full h-full object-contain"
            style={{ objectPosition: 'center' }}
            onError={handleImageError}
          />
        ) : (
          // Fallback placeholder
          <div className="flex flex-col items-center justify-center gap-2">
            <Package className="w-16 h-16 text-slate-500" />
            <span className="text-xs text-slate-400 text-center px-2">{property.title}</span>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 50%)',
          }}
        />
        <div className="absolute top-3 right-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
            style={{
              background:
                property.type === 'scan'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            {property.type === 'scan' ? '✓ 3D Scanned' : '↑ Uploaded'}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-lg font-bold text-white mb-0.5">{property.title}</h3>
        <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>
          {property.location}
        </p>
        <p
          className="text-xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {property.price}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            marginBottom: '2',
            paddingBottom: '2',
            marginTop: '2',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            color: '#94a3b8',
            textAlign: 'center',
            gap: '0',
          }}
        >
          <span>🛏️ {property.beds} beds</span>
          <span>🚿 {property.baths} baths</span>
          <span>📐 {property.sqft} sqft</span>
        </div>

        <div style={{
          display: 'flex',
          gap: '0',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={handleView}
            style={{
              flex: 1,
              minWidth: '100px',
              padding: '0.625rem 1rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 300ms',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              minHeight: '40px',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            <Eye className="w-4 h-4" />
            View 3D
          </button>
          {showDelete && (
            <button
              onClick={handleDelete}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '0.75rem',
                transition: 'all 300ms',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ef4444';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                e.target.style.color = '#ef4444';
              }}
              title="Delete property"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.75rem',
              transition: 'all 300ms',
              background: 'rgba(148, 163, 184, 0.1)',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#94a3b8';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(148, 163, 184, 0.1)';
              e.target.style.color = '#94a3b8';
            }}
            title="Share property"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

PropertyCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    beds: PropTypes.number.isRequired,
    baths: PropTypes.number.isRequired,
    sqft: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    price: PropTypes.string,
  }).isRequired,
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  showDelete: PropTypes.bool,
};

PropertyCard.defaultProps = {
  showDelete: true,
};

export default PropertyCard;
