import apiClient from './client';

const missionService = {
  /**
   * Get all missions for the current coach
   * @param {string} status - Filter by status ('DRAFT', 'SENT', 'ARCHIVED')
   */
  getMissions: async (status = null) => {
    const params = {};
    if (status) {
      params.status = status;
    }
    const response = await apiClient.get('/missions', { params });
    return response.data;
  },

  /**
   * Get mission by ID
   * @param {string} missionId - Mission ID
   */
  getMissionById: async (missionId) => {
    const response = await apiClient.get(`/missions/${missionId}`);
    return response.data;
  },

  /**
   * Create a new mission
   * @param {Object} missionData - Mission creation data { title, description, dueDate }
   */
  createMission: async (missionData) => {
    const response = await apiClient.post('/missions', missionData);
    return response.data;
  },

  /**
   * Update mission details
   * @param {string} missionId - Mission ID
   * @param {Object} updates - Fields to update { title, description, dueDate }
   */
  updateMission: async (missionId, updates) => {
    const response = await apiClient.put(`/missions/${missionId}`, updates);
    return response.data;
  },

  /**
   * Delete a draft mission
   * @param {string} missionId - Mission ID
   */
  deleteMission: async (missionId) => {
    const response = await apiClient.delete(`/missions/${missionId}`);
    return response.data;
  },

  /**
   * Archive a sent mission
   * @param {string} missionId - Mission ID
   */
  archiveMission: async (missionId) => {
    const response = await apiClient.post(`/missions/${missionId}/archive`);
    return response.data;
  },

  /**
   * Add recipients (teams/players) to a mission
   * @param {string} missionId - Mission ID
   * @param {Object} recipients - { teamIds: [], playerIds: [] }
   */
  addRecipients: async (missionId, recipients) => {
    const response = await apiClient.post(`/missions/${missionId}/recipients`, recipients);
    return response.data;
  },

  /**
   * Remove a recipient from a mission
   * @param {string} missionId - Mission ID
   * @param {string} playerId - Player ID
   */
  removeRecipient: async (missionId, playerId) => {
    const response = await apiClient.delete(`/missions/${missionId}/recipients/${playerId}`);
    return response.data;
  },

  /**
   * Get all recipients for a mission
   * @param {string} missionId - Mission ID
   * @param {Object} filters - { status, teamId }
   */
  getRecipients: async (missionId, filters = {}) => {
    const response = await apiClient.get(`/missions/${missionId}/recipients`, { params: filters });
    return response.data;
  },

  /**
   * Generate mission content for all recipients
   * @param {string} missionId - Mission ID
   */
  generateMissionContent: async (missionId) => {
    const response = await apiClient.post(`/missions/${missionId}/generate`);
    return response.data;
  },

  /**
   * Update a recipient's mission content
   * @param {string} missionId - Mission ID
   * @param {string} playerId - Player ID
   * @param {Object} content - { recommendedExercises, recommendedDrills, strengthAndConditioning, coachNotes }
   */
  updateRecipientContent: async (missionId, playerId, content) => {
    const response = await apiClient.put(`/missions/${missionId}/recipients/${playerId}`, content);
    return response.data;
  },

  /**
   * Send mission to all recipients
   * @param {string} missionId - Mission ID
   */
  sendMission: async (missionId) => {
    const response = await apiClient.post(`/missions/${missionId}/send`);
    return response.data;
  },

  /**
   * Get mission engagement statistics
   * @param {string} missionId - Mission ID
   */
  getMissionStats: async (missionId) => {
    const response = await apiClient.get(`/missions/${missionId}/stats`);
    return response.data;
  },

  // S&C Exercise endpoints
  /**
   * Get all S&C exercises with optional filters
   * @param {Object} filters - { category, difficulty, ageGroup, search }
   */
  getSCExercises: async (filters = {}) => {
    const response = await apiClient.get('/sc-exercises', { params: filters });
    return response.data;
  },

  /**
   * Get S&C exercises grouped by category
   */
  getSCExercisesByCategory: async () => {
    const response = await apiClient.get('/sc-exercises/by-category');
    return response.data;
  },

  /**
   * Get S&C exercises suitable for an age group
   * @param {string} ageGroup - Age group (e.g., 'U10', 'U12', 'U14', etc.)
   */
  getSCExercisesForAgeGroup: async (ageGroup) => {
    const response = await apiClient.get(`/sc-exercises/for-age-group/${ageGroup}`);
    return response.data;
  },

  /**
   * Get S&C exercise by ID
   * @param {string} exerciseId - Exercise ID
   */
  getSCExerciseById: async (exerciseId) => {
    const response = await apiClient.get(`/sc-exercises/${exerciseId}`);
    return response.data;
  },

  /**
   * Seed initial S&C exercises (superadmin only)
   */
  seedSCExercises: async () => {
    const response = await apiClient.post('/sc-exercises/seed');
    return response.data;
  },
};

export default missionService;
