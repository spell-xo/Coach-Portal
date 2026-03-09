import axios from 'axios';
import { store } from '../store';
import { setAccessToken, logout } from '../store/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4003/api/v1';

// Shared refresh promise to prevent concurrent refresh calls
let refreshPromise = null;

/**
 * Decode a JWT payload without a library.
 * Returns null if the token is malformed.
 */
const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

/**
 * Refresh the access token using the stored refresh token.
 * Returns the new access token, or null if refresh failed.
 * Deduplicates concurrent calls — only one refresh in-flight at a time.
 */
const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const state = store.getState();
    const refreshToken = state.auth.refreshToken;

    if (!refreshToken) return null;

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      const { accessToken: newAccessToken } = response.data.data;
      store.dispatch(setAccessToken(newAccessToken));
      return newAccessToken;
    } catch {
      store.dispatch(logout());
      window.location.href = '/login';
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Check if the current access token is close to expiring (within 60 seconds)
 * and proactively refresh it if needed.
 */
const ensureFreshToken = async () => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (!token) return;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const remainingSec = payload.exp - nowSec;

  // Refresh if less than 60 seconds remain
  if (remainingSec < 60) {
    await refreshAccessToken();
  }
};

/**
 * Drop-in replacement for fetch() that handles JWT token refresh.
 *
 * - Before each request, proactively refreshes if close to expiry
 * - On 401 response, refreshes the token and retries once
 * - Uses the same refresh endpoint and Redux flow as client.js
 *
 * Signature matches fetch() — pass url and options as usual.
 */
const fetchWithAuth = async (url, options = {}) => {
  // Proactive: refresh if token is close to expiring
  await ensureFreshToken();

  // Build headers with current (possibly just-refreshed) token
  const state = store.getState();
  const accessToken = state.auth.accessToken;
  const headers = { ...options.headers };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Reactive: if 401, try refreshing and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    }
  }

  return response;
};

export default fetchWithAuth;
export { ensureFreshToken };
