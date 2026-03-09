import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
// REACT_APP_API_URL already includes /api/v1, so we only add /app/signup
const API_PREFIX = '/app/signup';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * App Signup Consent API Service
 */
const appSignupConsentService = {
  /**
   * Get consent details by token
   */
  getConsent: async (token) => {
    const response = await apiClient.get(`/consent/${token}`);
    return response.data;
  },

  /**
   * Check if parent email already has an account
   */
  checkParentExists: async (token) => {
    const response = await apiClient.get(`/consent/${token}/check-parent`);
    return response.data;
  },

  /**
   * Register new parent account
   */
  registerParent: async (token, data) => {
    const response = await apiClient.post(`/consent/${token}/parent`, data);
    return response.data;
  },

  /**
   * Login existing parent
   */
  loginParent: async (token, data) => {
    const response = await apiClient.post(`/consent/${token}/parent/login`, data);
    return response.data;
  },

  /**
   * Accept terms and conditions
   */
  acceptTerms: async (token, data) => {
    const response = await apiClient.post(`/consent/${token}/terms`, data);
    return response.data;
  },

  /**
   * Get existing children for parent
   */
  getExistingChildren: async (token) => {
    const response = await apiClient.get(`/consent/${token}/children`);
    return response.data;
  },

  /**
   * Check if handle is available
   */
  checkHandle: async (handle) => {
    const response = await apiClient.get(`/consent/check-handle/${handle}`);
    return response.data;
  },

  /**
   * Create child account (UNDER_13 flow)
   */
  createChild: async (token, data) => {
    const response = await apiClient.post(`/consent/${token}/child`, data);
    return response.data;
  },

  /**
   * Grant teen consent (13-17 flow)
   * Updates existing teen account's parentalConsent status instead of creating new account
   */
  grantTeenConsent: async (token) => {
    const response = await apiClient.post(`/consent/${token}/grant-teen-consent`);
    return response.data;
  },

  /**
   * Complete consent flow
   */
  completeConsent: async (token) => {
    const response = await apiClient.post(`/consent/${token}/complete`);
    return response.data;
  },

  /**
   * Upload ID document
   */
  uploadIdDocument: async (token, file) => {
    const formData = new FormData();
    formData.append('idDocument', file);

    const response = await apiClient.post(`/consent/${token}/upload-id`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Resend consent email
   */
  resendEmail: async (token) => {
    const response = await apiClient.post(`/consent/${token}/resend-email`);
    return response.data;
  },

  /**
   * Get player signup details by playerSignupToken (13-18 academy flow)
   */
  getPlayerSignup: async (token) => {
    const response = await apiClient.get(`/consent/player-signup/${token}`);
    return response.data;
  },

  /**
   * Complete player signup (13-18 academy flow)
   */
  completePlayerSignup: async (token, data) => {
    const response = await apiClient.post(`/consent/player-signup/${token}`, data);
    return response.data;
  },
};

export default appSignupConsentService;
