import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Home, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import Turnstile from '../../components/common/Turnstile';
import './AuthPages.css';

// Cloudflare Turnstile Site Key
const TURNSTILE_SITE_KEY = '0x4AAAAAAChiVEGYB4kJISDZ';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.name.length < 2) {
      setError('Name must be at least 2 characters');
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check Turnstile verification
    if (!turnstileToken) {
      setError('Please complete the security verification');
      return false;
    }

    return true;
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength, label: labels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength();

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

      // Proceed with registration
      const result = await register(formData.email, formData.password, formData.name);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background decoration */}
      <div className="auth-background">
        <div className="auth-gradient auth-gradient-register"></div>
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
            <div className="auth-icon-wrapper auth-icon-register">
              <UserPlus size={32} />
            </div>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join our 3D real estate community</p>
          </div>

          {/* Error display */}
          {(error || authError) && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error || authError}</span>
            </div>
          )}

          {/* Register form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name input */}
            <div className="auth-input-group">
              <label htmlFor="name" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" size={18} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="auth-input"
                  disabled={isSubmitting}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

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
                  placeholder="At least 6 characters"
                  className="auth-input"
                  disabled={isSubmitting}
                  autoComplete="new-password"
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
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div 
                      className={`password-strength-fill strength-${passwordStrength.strength}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="password-strength-label">
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password input */}
            <div className="auth-input-group">
              <label htmlFor="confirmPassword" className="auth-label">
                Confirm Password
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  className="auth-input"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="auth-password-toggle"
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="password-match">
                  <CheckCircle size={14} />
                  <span>Passwords match</span>
                </div>
              )}
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
              className="auth-submit-button auth-submit-register"
              disabled={isSubmitting || loading || !turnstileToken}
              style={{
                opacity: (!turnstileToken || isSubmitting || loading) ? 0.6 : 1,
                cursor: (!turnstileToken || isSubmitting || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <span className="auth-loading">
                  <span className="auth-spinner"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-link-primary">
                Sign in
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

        {/* Benefits list */}
        <div className="auth-benefits">
          <h3 className="auth-benefits-title">Why join us?</h3>
          <ul className="auth-benefits-list">
            <li className="auth-benefit-item">
              <CheckCircle size={18} className="auth-benefit-icon" />
              <span>Upload unlimited 3D property models</span>
            </li>
            <li className="auth-benefit-item">
              <CheckCircle size={18} className="auth-benefit-icon" />
              <span>Access advanced analytics dashboard</span>
            </li>
            <li className="auth-benefit-item">
              <CheckCircle size={18} className="auth-benefit-icon" />
              <span>Save favorite properties</span>
            </li>
            <li className="auth-benefit-item">
              <CheckCircle size={18} className="auth-benefit-icon" />
              <span>Collaborate with team members</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
