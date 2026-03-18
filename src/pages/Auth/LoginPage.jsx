import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Home, Lock, Mail, AlertCircle } from 'lucide-react';
import Turnstile from '../../components/common/Turnstile';
import './AuthPages.css';

// Cloudflare Turnstile Site Key
const TURNSTILE_SITE_KEY = '0x4AAAAAAChiVEGYB4kJISDZ';

// Get API base URL (dynamic for production and development)
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Production: use Render backend
  if (hostname === 'realestate3d-demo.com' || hostname.includes('workers.dev')) {
    return 'https://realestate3d-backend.onrender.com/api';
  }
  
  // Development: use localhost or local network IP
  return `http://${hostname}:5000/api`;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    // Check Turnstile verification
    if (!turnstileToken) {
      setError('Please complete the security verification');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Verify Turnstile token with backend
      const verifyResponse = await fetch(`${getApiBaseUrl()}/turnstile/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        setError('Security verification failed. Please refresh and try again.');
        setTurnstileToken(null);
        setIsSubmitting(false);
        return;
      }

      // Proceed with login
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background decoration */}
      <div className="auth-background">
        <div className="auth-gradient"></div>
        <div className="auth-grid"></div>
      </div>

      {/* Home button */}
      <Link to="/" className="auth-home-button">
        <Home size={20} />
        <span>Back to Home</span>
      </Link>

      {/* Main content */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon-wrapper">
              <Lock size={32} />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to access your 3D property portfolio</p>
          </div>

          {/* Error display */}
          {(error || authError) && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error || authError}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email input */}
            <div className="auth-input-group">
              <label htmlFor="email" className="auth-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="auth-input"
                  disabled={isSubmitting}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div className="auth-input-group">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="auth-input"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="auth-forgot-password">
              <Link to="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>

            {/* Cloudflare Turnstile Widget */}
            <Turnstile
              siteKey={TURNSTILE_SITE_KEY}
              onVerify={(token) => {
                console.log('✅ Turnstile verified');
                setTurnstileToken(token);
              }}
              onError={() => {
                setError('Security check failed. Please refresh the page.');
                setTurnstileToken(null);
              }}
              onExpire={() => {
                setTurnstileToken(null);
              }}
              theme="dark"
            />

            {/* Submit button */}
            <button
              type="submit"
              className="auth-submit-button"
              disabled={isSubmitting || loading || !turnstileToken}
              style={{
                opacity: (!turnstileToken || isSubmitting || loading) ? 0.6 : 1,
                cursor: (!turnstileToken || isSubmitting || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <span className="auth-loading">
                  <span className="auth-spinner"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register link */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link-primary">
                Create one now
              </Link>
            </p>
          </div>

          {/* Security badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1rem',
            color: '#64748b',
            fontSize: '0.75rem'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Protected by Cloudflare
          </div>
        </div>

        {/* Feature highlights */}
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">🏠</div>
            <div className="auth-feature-text">
              <h3>Browse Properties</h3>
              <p>Explore immersive 3D property tours</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">📤</div>
            <div className="auth-feature-text">
              <h3>Upload Models</h3>
              <p>Share your 3D architectural designs</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">📊</div>
            <div className="auth-feature-text">
              <h3>Track Analytics</h3>
              <p>Monitor engagement and performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
