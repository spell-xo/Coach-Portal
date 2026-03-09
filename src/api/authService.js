import apiClient from './client';

export const authService = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  switchRole: async (role) => {
    const response = await apiClient.put('/auth/switch-role', { role });
    return response.data;
  },

  /**
   * Validate invitation token and get invitation details
   * Tries player/team invitations, staff invitations, and guardian invitations
   * @param {string} token - Invitation token
   * @returns {Promise} Invitation details
   */
  validateInvitation: async (token) => {
    console.log('[AuthService Debug] Validating invitation with token:', token);

    // Try player/team invitation first
    try {
      console.log('[AuthService Debug] Trying player invitation endpoint...');
      const response = await apiClient.get(`/invitations/${token}`);
      console.log('[AuthService Debug] Player invitation response:', response.data);
      return { ...response.data, invitationType: 'player' };
    } catch (error) {
      console.log('[AuthService Debug] Player invitation failed:', error.response?.status);

      // If player invitation not found, try staff invitation
      if (error.response?.status === 404) {
        try {
          console.log('[AuthService Debug] Trying staff invitation endpoint...');
          const staffResponse = await apiClient.get(`/clubs/staff-invitations/${token}`);
          console.log('[AuthService Debug] Staff invitation response:', staffResponse.data);
          return { ...staffResponse.data, invitationType: 'staff' };
        } catch (staffError) {
          console.log('[AuthService Debug] Staff invitation failed:', staffError.response?.status);

          // If staff invitation not found (404) or unauthorized (401), try guardian invitation
          if (staffError.response?.status === 404 || staffError.response?.status === 401) {
            try {
              console.log('[AuthService Debug] Trying guardian invitation endpoint...');
              const guardianResponse = await apiClient.get(`/invitations/guardian/${token}`);
              console.log('[AuthService Debug] Guardian invitation response:', guardianResponse.data);
              const result = { ...guardianResponse.data, invitationType: 'guardian' };
              console.log('[AuthService Debug] Returning guardian result:', result);
              return result;
            } catch (guardianError) {
              console.error('[AuthService Debug] Guardian invitation failed:', guardianError.response?.status, guardianError.response?.data);
              // If all three fail, throw the guardian error
              throw guardianError;
            }
          }
          throw staffError;
        }
      }
      // If error is not 404, throw original error
      throw error;
    }
  },

  /**
   * Register new player with invitation token
   * @param {Object} data - Signup data (token, name, password)
   * @returns {Promise} User and tokens
   */
  signupWithInvitation: async (data) => {
    const response = await apiClient.post('/auth/signup-with-invitation', data);
    return response.data;
  },

  /**
   * Accept invitation for existing user
   * @param {string} token - Invitation token
   * @returns {Promise} Acceptance result with club context
   */
  acceptInvitation: async (token) => {
    const response = await apiClient.post(`/invitations/${token}/accept`);
    return response.data;
  },

  /**
   * Accept guardian invitation for existing user
   * @param {string} token - Guardian invitation token
   * @returns {Promise} Acceptance result
   */
  acceptGuardianInvitation: async (token) => {
    const response = await apiClient.post(`/invitations/guardian/${token}/accept`);
    return response.data;
  },

  /**
   * Signup as guardian with invitation (auto-accepts invitation during signup)
   * @param {Object} data - Signup data (token, name, password, etc.)
   * @returns {Promise} User and tokens
   */
  signupAsGuardian: async (data) => {
    // First signup with the invitation
    const signupResponse = await apiClient.post('/auth/signup-with-invitation', data);

    // If signup successful, accept the guardian invitation
    if (signupResponse.data.success) {
      try {
        await apiClient.post(`/invitations/guardian/${data.token}/accept`);
      } catch (acceptError) {
        console.warn('Failed to auto-accept guardian invitation:', acceptError);
        // Don't fail signup if invitation accept fails - user can try again
      }
    }

    return signupResponse.data;
  },
};

export default authService;
