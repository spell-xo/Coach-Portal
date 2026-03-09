import apiClient from './client';

export const contextService = {
  /**
   * Get list of available contexts for the authenticated user
   * @returns {Promise} Response with array of contexts
   */
  listContexts: async () => {
    const response = await apiClient.get('/context/list');
    return response.data;
  },

  /**
   * Switch to a different context
   * @param {Object} contextData - { contextType: 'personal' | 'club', clubId?: string }
   * @returns {Promise} Response with new JWT token and context info
   */
  switchContext: async (contextData) => {
    const response = await apiClient.post('/context/switch', contextData);
    return response.data;
  },
};

export default contextService;
