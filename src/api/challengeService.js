import apiClient from './client';

const challengeService = {
  /**
   * Get user's challenges with optional filtering
   * @param {string} status - Filter by status ('pending', 'active', 'completed')
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  getUserChallenges: async (status = null, page = 1, limit = 50) => {
    const params = { page, limit };
    if (status) {
      params.status = status;
    }
    const response = await apiClient.get('/challenges', { params });
    return response.data;
  },

  /**
   * Get challenge by ID
   * @param {string} challengeId - Challenge ID
   */
  getChallengeById: async (challengeId) => {
    const response = await apiClient.get(`/challenges/${challengeId}`);
    return response.data;
  },

  /**
   * Create a new challenge
   * @param {Object} challengeData - Challenge creation data
   */
  createChallenge: async (challengeData) => {
    const response = await apiClient.post('/challenges', challengeData);
    return response.data;
  },

  /**
   * Accept a challenge invitation
   * @param {string} challengeId - Challenge ID
   */
  acceptChallenge: async (challengeId) => {
    const response = await apiClient.post('/challenges/accept', { challengeId });
    return response.data;
  },

  /**
   * Decline a challenge invitation
   * @param {string} challengeId - Challenge ID
   */
  declineChallenge: async (challengeId) => {
    const response = await apiClient.post('/challenges/decline', { challengeId });
    return response.data;
  },

  /**
   * Cancel a challenge (creator only)
   * @param {string} challengeId - Challenge ID
   */
  cancelChallenge: async (challengeId) => {
    const response = await apiClient.post(`/challenges/${challengeId}/cancel`);
    return response.data;
  },

  /**
   * Get available drills for challenge creation
   */
  getAvailableDrills: async () => {
    const response = await apiClient.get('/challenges/drills/available');
    return response.data;
  },

  /**
   * Get challenge progress for all participants
   * @param {string} challengeId - Challenge ID
   */
  getChallengeProgress: async (challengeId) => {
    const response = await apiClient.get(`/challenges/${challengeId}/progress`);
    return response.data;
  },

  /**
   * Get participant's drill details
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - Participant user ID
   */
  getParticipantDrills: async (challengeId, userId) => {
    const response = await apiClient.get(`/challenges/${challengeId}/participant/${userId}/drills`);
    return response.data;
  },

  /**
   * Enable challenge group chat
   * @param {string} challengeId - Challenge ID
   */
  enableChallengeChat: async (challengeId) => {
    const response = await apiClient.post(`/challenges/${challengeId}/enable-chat`);
    return response.data;
  },

  /**
   * Get current weekly challenge
   */
  getWeeklyChallenge: async () => {
    const response = await apiClient.get('/challenges/weekly');
    return response.data;
  },

  /**
   * Get weekly challenge leaderboard
   * @param {string} challengeId - Challenge ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  getWeeklyChallengeLeaderboard: async (challengeId, page = 1, limit = 100) => {
    const response = await apiClient.get(`/challenges/${challengeId}/leaderboard`, {
      params: { page, limit },
    });
    return response.data;
  },
};

export default challengeService;
