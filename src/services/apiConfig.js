/**
 * Central API configuration.
 *
 * Use REACT_APP_API_BASE_URL to pin production/staging endpoints.
 * Examples:
 * - https://api.example.com/api
 * - https://staging-api.example.com/api
 */

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const getFallbackApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPrivateIp = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);

  // Local development: frontend on :3000, backend on :5000.
  if (isLocalhost || isPrivateIp) {
    return `http://${hostname}:5000/api`;
  }

  // Reverse-proxy style fallback for hosted environments.
  return `${protocol}//${hostname}/api`;
};

const fromEnv = process.env.REACT_APP_API_BASE_URL?.trim();
const resolvedApiBaseUrl = fromEnv ? trimTrailingSlash(fromEnv) : getFallbackApiBaseUrl();

export const API_BASE_URL = resolvedApiBaseUrl;

export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
})();
