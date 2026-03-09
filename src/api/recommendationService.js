import apiClient from './client';

const recommendationService = {
  // ======================================================================
  // TRAINING EXERCISES
  // ======================================================================

  /**
   * Get all training exercises with optional filters
   * @param {Object} params - Filter parameters
   * @param {string} params.category - Filter by category (PASSING, DRIBBLING, etc.)
   * @param {string} params.difficulty - Filter by difficulty (BEGINNER, INTERMEDIATE, ADVANCED)
   * @param {string} params.search - Search by name or description
   * @param {string} params.clubId - Filter by club (null for system-wide)
   * @returns {Promise<Object>} - { success, exercises }
   */
  getTrainingExercises: async (params = {}) => {
    const response = await apiClient.get('/training-exercises', { params });
    return response.data;
  },

  /**
   * Get all exercise categories
   * @returns {Promise<Object>} - { success, categories }
   */
  getExerciseCategories: async () => {
    const response = await apiClient.get('/training-exercises/categories');
    return response.data;
  },

  /**
   * Get all exercise category groups
   * @returns {Promise<Object>} - { success, data: [{ value, label }] }
   */
  getExerciseCategoryGroups: async () => {
    const response = await apiClient.get('/training-exercises/category-groups');
    return response.data;
  },

  /**
   * Get single training exercise by ID
   * @param {string} exerciseId - Exercise ID
   * @returns {Promise<Object>} - { success, exercise }
   */
  getTrainingExercise: async (exerciseId) => {
    const response = await apiClient.get(`/training-exercises/${exerciseId}`);
    return response.data;
  },

  /**
   * Create new training exercise
   * @param {Object} exerciseData - Exercise data
   * @returns {Promise<Object>} - { success, exercise }
   */
  createTrainingExercise: async (exerciseData) => {
    const response = await apiClient.post('/training-exercises', exerciseData);
    return response.data;
  },

  /**
   * Update training exercise
   * @param {string} exerciseId - Exercise ID
   * @param {Object} exerciseData - Updated exercise data
   * @returns {Promise<Object>} - { success, exercise }
   */
  updateTrainingExercise: async (exerciseId, exerciseData) => {
    const response = await apiClient.put(`/training-exercises/${exerciseId}`, exerciseData);
    return response.data;
  },

  /**
   * Delete training exercise
   * @param {string} exerciseId - Exercise ID
   * @returns {Promise<Object>} - { success, message }
   */
  deleteTrainingExercise: async (exerciseId) => {
    const response = await apiClient.delete(`/training-exercises/${exerciseId}`);
    return response.data;
  },

  /**
   * Bulk import training exercises
   * @param {Array<Object>} exercises - Array of exercise objects
   * @returns {Promise<Object>} - { success, imported, failed, errors }
   */
  bulkImportExercises: async (exercises) => {
    const response = await apiClient.post('/training-exercises/bulk-import', { exercises });
    return response.data;
  },

  // ======================================================================
  // RECOMMENDATION RULES
  // ======================================================================

  /**
   * Get all recommendation rules with optional filters
   * @param {Object} params - Filter parameters
   * @param {string} params.category - Filter by exercise category
   * @param {boolean} params.isActive - Filter by active status
   * @param {string} params.clubId - Filter by club
   * @param {boolean} params.ineffective - Show only ineffective rules
   * @returns {Promise<Object>} - { success, rules }
   */
  getRecommendationRules: async (params = {}) => {
    const response = await apiClient.get('/recommendation-rules', { params });
    return response.data;
  },

  /**
   * Get ineffective rules (for notifications)
   * @returns {Promise<Object>} - { success, rules }
   */
  getIneffectiveRules: async () => {
    const response = await apiClient.get('/recommendation-rules/ineffective');
    return response.data;
  },

  /**
   * Get single recommendation rule by ID
   * @param {string} ruleId - Rule ID
   * @returns {Promise<Object>} - { success, rule }
   */
  getRecommendationRule: async (ruleId) => {
    const response = await apiClient.get(`/recommendation-rules/${ruleId}`);
    return response.data;
  },

  /**
   * Create new recommendation rule
   * @param {Object} ruleData - Rule data
   * @returns {Promise<Object>} - { success, rule }
   */
  createRecommendationRule: async (ruleData) => {
    const response = await apiClient.post('/recommendation-rules', ruleData);
    return response.data;
  },

  /**
   * Update recommendation rule
   * @param {string} ruleId - Rule ID
   * @param {Object} ruleData - Updated rule data
   * @returns {Promise<Object>} - { success, rule }
   */
  updateRecommendationRule: async (ruleId, ruleData) => {
    const response = await apiClient.put(`/recommendation-rules/${ruleId}`, ruleData);
    return response.data;
  },

  /**
   * Delete recommendation rule
   * @param {string} ruleId - Rule ID
   * @returns {Promise<Object>} - { success, message }
   */
  deleteRecommendationRule: async (ruleId) => {
    const response = await apiClient.delete(`/recommendation-rules/${ruleId}`);
    return response.data;
  },

  /**
   * Test recommendation rule against sample data
   * @param {string} ruleId - Rule ID
   * @param {Object} testData - Test data { performanceMetrics, drillType }
   * @returns {Promise<Object>} - { success, isMatch, matchScore, triggeringMetrics }
   */
  testRecommendationRule: async (ruleId, testData) => {
    const response = await apiClient.post(`/recommendation-rules/${ruleId}/test`, testData);
    return response.data;
  },

  /**
   * Bulk import recommendation rules
   * @param {Array<Object>} rules - Array of rule objects
   * @returns {Promise<Object>} - { success, imported, failed, errors }
   */
  bulkImportRules: async (rules) => {
    const response = await apiClient.post('/recommendation-rules/bulk-import', { rules });
    return response.data;
  },

  // ======================================================================
  // PLAYER RECOMMENDATIONS
  // ======================================================================

  /**
   * Get all recommendations for a player
   * @param {string} playerId - Player ID
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status (PENDING, IN_PROGRESS, COMPLETED, etc.)
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>} - { success, recommendations, pagination }
   */
  getPlayerRecommendations: async (playerId, params = {}) => {
    const response = await apiClient.get(`/players/${playerId}/recommendations`, { params });
    return response.data;
  },

  /**
   * Get recommendation statistics for a player
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} - { success, stats }
   */
  getPlayerRecommendationStats: async (playerId) => {
    const response = await apiClient.get(`/players/${playerId}/recommendations/stats`);
    return response.data;
  },

  /**
   * Get recommendations for a specific drill
   * @param {string} drillId - Drill ID
   * @returns {Promise<Object>} - { success, recommendations }
   */
  getDrillRecommendations: async (drillId) => {
    const response = await apiClient.get(`/drills/${drillId}/recommendations`);
    return response.data;
  },

  /**
   * Update recommendation status
   * @param {string} playerId - Player ID
   * @param {string} recommendationId - Recommendation ID
   * @param {string} status - New status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED, DISMISSED)
   * @returns {Promise<Object>} - { success, recommendation }
   */
  updateRecommendationStatus: async (playerId, recommendationId, status) => {
    const response = await apiClient.put(
      `/players/${playerId}/recommendations/${recommendationId}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * Mark recommendation as completed with feedback
   * @param {string} playerId - Player ID
   * @param {string} recommendationId - Recommendation ID
   * @param {Object} feedback - Feedback data
   * @param {number} feedback.playerRating - Rating (1-5)
   * @param {boolean} feedback.wasHelpful - Was it helpful
   * @param {string} feedback.playerNotes - Player notes
   * @returns {Promise<Object>} - { success, recommendation }
   */
  completeRecommendation: async (playerId, recommendationId, feedback) => {
    const response = await apiClient.post(
      `/players/${playerId}/recommendations/${recommendationId}/complete`,
      feedback
    );
    return response.data;
  },

  /**
   * Dismiss recommendation
   * @param {string} playerId - Player ID
   * @param {string} recommendationId - Recommendation ID
   * @param {string} reason - Reason for dismissal
   * @returns {Promise<Object>} - { success, recommendation }
   */
  dismissRecommendation: async (playerId, recommendationId, reason) => {
    const response = await apiClient.post(
      `/players/${playerId}/recommendations/${recommendationId}/dismiss`,
      { reason }
    );
    return response.data;
  },

  /**
   * Add coach notes to recommendation
   * @param {string} playerId - Player ID
   * @param {string} recommendationId - Recommendation ID
   * @param {string} coachNotes - Coach notes
   * @returns {Promise<Object>} - { success, recommendation }
   */
  addCoachNotes: async (playerId, recommendationId, coachNotes) => {
    const response = await apiClient.post(
      `/players/${playerId}/recommendations/${recommendationId}/coach-notes`,
      { coachNotes }
    );
    return response.data;
  },

  // ======================================================================
  // WEBHOOKS (Admin/Testing)
  // ======================================================================

  /**
   * Trigger recommendation generation for a completed drill
   * @param {string} drillId - Drill ID
   * @returns {Promise<Object>} - { success, drillId, playerId, recommendationsGenerated }
   */
  triggerDrillRecommendations: async (drillId) => {
    const response = await apiClient.post('/webhooks/drill-completed', { drillId });
    return response.data;
  },

  /**
   * Batch process drills for recommendation generation
   * @param {Array<string>} drillIds - Array of drill IDs
   * @returns {Promise<Object>} - { success, results }
   */
  batchProcessDrills: async (drillIds) => {
    const response = await apiClient.post('/webhooks/batch-process-drills', { drillIds });
    return response.data;
  },
};

export default recommendationService;
