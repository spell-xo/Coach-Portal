import axios from 'axios';
import { store } from '../store';
import { setAccessToken, logout } from '../store/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4003/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach access token to requests
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state.auth.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Check if this is a public endpoint that doesn't require auth
      // Don't redirect to login for invitation validation or other public endpoints
      const publicEndpoints = [
        '/invitations/',
        '/guardians/invitations/',
        '/clubs/staff-invitations/',
        '/auth/login',
        '/auth/signup',
        '/auth/register',
      ];

      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        originalRequest.url?.includes(endpoint)
      );

      if (isPublicEndpoint) {
        // For public endpoints, just reject the error without redirecting
        return Promise.reject(error);
      }

      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        try {
          // Attempt to refresh the access token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken: newAccessToken } = response.data.data;

          // Update the access token in Redux
          store.dispatch(setAccessToken(newAccessToken));

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed - log out the user
          store.dispatch(logout());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - for fallback/demo mode (no real auth), just reject without redirect
        if (originalRequest.url?.includes('/clubs/') && !state.auth.refreshToken) {
          return Promise.reject(error);
        }
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
