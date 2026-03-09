import apiClient from './client';

const coachPointsService = {
  // ======================================================================
  // COACH POINTS (User-facing)
  // ======================================================================

  /**
   * Get current coach's points summary
   * @returns {Promise<Object>} - { success, data: summary }
   */
  getMyPointsSummary: async () => {
    const response = await apiClient.get('/coach/points/summary');
    return response.data;
  },

  /**
   * Get current coach's points history
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Items per page
   * @param {number} params.offset - Skip count
   * @param {string} params.category - Filter by category
   * @param {string} params.startDate - Start date filter
   * @param {string} params.endDate - End date filter
   * @returns {Promise<Object>} - { success, data: transactions, pagination }
   */
  getMyPointsHistory: async (params = {}) => {
    const response = await apiClient.get('/coach/points/history', { params });
    return response.data;
  },

  /**
   * Get current coach's streaks
   * @returns {Promise<Object>} - { success, data: streaks }
   */
  getMyStreaks: async () => {
    const response = await apiClient.get('/coach/points/streaks');
    return response.data;
  },

  /**
   * Get current coach's milestones
   * @returns {Promise<Object>} - { success, data: milestones }
   */
  getMyMilestones: async () => {
    const response = await apiClient.get('/coach/points/milestones');
    return response.data;
  },

  /**
   * Get category breakdown
   * @returns {Promise<Object>} - { success, data: breakdown }
   */
  getMyCategoryBreakdown: async () => {
    const response = await apiClient.get('/coach/points/categories');
    return response.data;
  },

  /**
   * Get club leaderboard
   * @param {string} clubId - Optional club ID
   * @param {number} limit - Number of entries
   * @returns {Promise<Object>} - { success, data: leaderboard }
   */
  getClubLeaderboard: async (clubId = null, limit = 10) => {
    const params = { limit };
    if (clubId) params.clubId = clubId;
    const response = await apiClient.get('/coach/points/leaderboard', { params });
    return response.data;
  },

  /**
   * Get global leaderboard
   * @param {number} limit - Number of entries
   * @returns {Promise<Object>} - { success, data: leaderboard }
   */
  getGlobalLeaderboard: async (limit = 10) => {
    const response = await apiClient.get('/coach/points/leaderboard/global', { params: { limit } });
    return response.data;
  },

  /**
   * Get expiring streaks
   * @returns {Promise<Object>} - { success, data: streaks }
   */
  getExpiringStreaks: async () => {
    const response = await apiClient.get('/coach/points/expiring-streaks');
    return response.data;
  },

  // ======================================================================
  // SUPER ADMIN CONFIG
  // ======================================================================

  /**
   * Get all point configurations
   * @param {Object} params - Query parameters
   * @param {string} params.category - Filter by category
   * @param {boolean} params.isActive - Filter by active status
   * @returns {Promise<Object>} - { success, data: configs }
   */
  getAllConfigs: async (params = {}) => {
    const response = await apiClient.get('/superadmin/coach-points/config', { params });
    return response.data;
  },

  /**
   * Get configs grouped by category
   * @returns {Promise<Object>} - { success, data: grouped }
   */
  getConfigsByCategory: async () => {
    const response = await apiClient.get('/superadmin/coach-points/config/by-category');
    return response.data;
  },

  /**
   * Get single configuration by activity code
   * @param {string} activityCode - Activity code
   * @returns {Promise<Object>} - { success, data: config }
   */
  getConfigByCode: async (activityCode) => {
    const response = await apiClient.get(`/superadmin/coach-points/config/${activityCode}`);
    return response.data;
  },

  /**
   * Create new configuration
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} - { success, data: config }
   */
  createConfig: async (configData) => {
    const response = await apiClient.post('/superadmin/coach-points/config', configData);
    return response.data;
  },

  /**
   * Update configuration
   * @param {string} activityCode - Activity code
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - { success, data: config }
   */
  updateConfig: async (activityCode, updateData) => {
    const response = await apiClient.put(`/superadmin/coach-points/config/${activityCode}`, updateData);
    return response.data;
  },

  /**
   * Delete configuration
   * @param {string} activityCode - Activity code
   * @param {boolean} hardDelete - Permanently delete
   * @returns {Promise<Object>} - { success, data: config }
   */
  deleteConfig: async (activityCode, hardDelete = false) => {
    const response = await apiClient.delete(`/superadmin/coach-points/config/${activityCode}`, {
      params: { hardDelete }
    });
    return response.data;
  },

  /**
   * Bulk update configurations
   * @param {Array<Object>} configs - Array of config updates
   * @returns {Promise<Object>} - { success, data: result }
   */
  bulkUpdateConfigs: async (configs) => {
    const response = await apiClient.put('/superadmin/coach-points/config/bulk', { configs });
    return response.data;
  },

  /**
   * Toggle activity status
   * @param {string} activityCode - Activity code
   * @returns {Promise<Object>} - { success, data: config }
   */
  toggleActivityStatus: async (activityCode) => {
    const response = await apiClient.post(`/superadmin/coach-points/config/${activityCode}/toggle`);
    return response.data;
  },

  /**
   * Get available categories
   * @returns {Promise<Object>} - { success, data: categories }
   */
  getCategories: async () => {
    const response = await apiClient.get('/superadmin/coach-points/categories');
    return response.data;
  },

  /**
   * Get config statistics
   * @returns {Promise<Object>} - { success, data: stats }
   */
  getConfigStats: async () => {
    const response = await apiClient.get('/superadmin/coach-points/config/stats');
    return response.data;
  },

  /**
   * Get system analytics
   * @returns {Promise<Object>} - { success, data: analytics }
   */
  getSystemAnalytics: async () => {
    const response = await apiClient.get('/superadmin/coach-points/analytics');
    return response.data;
  },

  /**
   * Export all configurations
   * @returns {Promise<Object>} - { success, data: configs }
   */
  exportConfigs: async () => {
    const response = await apiClient.get('/superadmin/coach-points/config/export');
    return response.data;
  },

  /**
   * Import configurations
   * @param {Array<Object>} configs - Array of config objects
   * @returns {Promise<Object>} - { success, data: result }
   */
  importConfigs: async (configs) => {
    const response = await apiClient.post('/superadmin/coach-points/config/import', { configs });
    return response.data;
  },

  /**
   * Get global leaderboard for super admin
   * @param {number} limit - Number of entries
   * @returns {Promise<Object>} - { success, data: leaderboard }
   */
  getSuperAdminLeaderboard: async (limit = 50) => {
    const response = await apiClient.get('/superadmin/coach-points/leaderboard', { params: { limit } });
    return response.data;
  }
};

export default coachPointsService;
