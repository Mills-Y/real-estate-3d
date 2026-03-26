import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Cloudflare Turnstile Component
 * Provides invisible bot protection for forms
 * 
 * Usage:
 * <Turnstile siteKey="your-site-key" onVerify={(token) => setToken(token)} />
 */
const Turnstile = ({ siteKey, onVerify, onError, onExpire, theme = 'dark', size = 'normal' }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        renderWidget();
      };
    } else {
      renderWidget();
    }

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey]);

  const renderWidget = () => {
    if (containerRef.current && window.turnstile) {
      // Remove existing widget if any
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      // Render new widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          console.log('✅ Turnstile verified');
          onVerify && onVerify(token);
        },
        'error-callback': (error) => {
          console.error('❌ Turnstile error:', error);
          onError && onError(error);
        },
        'expired-callback': () => {
          console.log('⚠️ Turnstile expired');
          onExpire && onExpire();
        },
        theme: theme,
        size: size,
      });
    }
  };

  // Method to reset the widget (call after form submission)
  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '1rem 0' 
      }} 
    />
  );
};

Turnstile.propTypes = {
  siteKey: PropTypes.string.isRequired,
  onVerify: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onExpire: PropTypes.func,
  theme: PropTypes.oneOf(['light', 'dark', 'auto']),
  size: PropTypes.oneOf(['normal', 'compact']),
};

export default Turnstile;
