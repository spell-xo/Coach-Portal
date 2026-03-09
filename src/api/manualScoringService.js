import apiClient from './client';

const manualScoringService = {
  /**
   * Get videos available for manual scoring
   * @param {Object} filters - Optional filters { gameType, limit }
   * @returns {Promise<Object>} Response with videos array
   */
  getVideosForScoring: async (filters = {}) => {
    const response = await apiClient.get('/manual-scoring/videos', { params: filters });
    return response.data;
  },

  /**
   * Get manual scores for a specific video
   * @param {string} videoId - Video upload ID
   * @returns {Promise<Object>} Response with manual scores array
   */
  getManualScoresByVideo: async (videoId) => {
    const response = await apiClient.get(`/manual-scoring/video/${videoId}`);
    return response.data;
  },

  /**
   * Create a new manual score
   * @param {Object} scoreData - Score data
   * @param {string} scoreData.videoUploadsId - Video upload ID
   * @param {string} scoreData.granularity - Granularity level (overall, category, metric, activity)
   * @param {Object} scoreData.scores - Scores object based on granularity
   * @param {string} [scoreData.notes] - Optional notes
   * @param {number} scoreData.scoringDuration - Time spent scoring in seconds
   * @param {string} scoreData.status - Score status (draft, submitted)
   * @param {number} [scoreData.confidenceLevel] - Confidence level (1-5)
   * @param {number} [scoreData.difficultyRating] - Difficulty rating (1-5)
   * @returns {Promise<Object>} Response with created manual score
   */
  createManualScore: async (scoreData) => {
    const response = await apiClient.post('/manual-scoring', scoreData);
    return response.data;
  },

  /**
   * Update an existing manual score
   * @param {string} scoreId - Manual score ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Response with updated manual score
   */
  updateManualScore: async (scoreId, updates) => {
    const response = await apiClient.patch(`/manual-scoring/${scoreId}`, updates);
    return response.data;
  },

  /**
   * Get AI vs manual score comparison for a video
   * @param {string} videoId - Video upload ID
   * @returns {Promise<Object>} Response with comparison data
   */
  getComparisonData: async (videoId) => {
    const response = await apiClient.get(`/manual-scoring/comparison/${videoId}`);
    return response.data;
  },

  /**
   * Get list of video IDs that have been scored by the current coach
   * @returns {Promise<Object>} Response with array of video IDs
   */
  getScoredVideoIds: async () => {
    const response = await apiClient.get('/manual-scoring/scored-videos');
    return response.data;
  },

  /**
   * Get quality metrics for manual scoring
   * @returns {Promise<Object>} Response with quality metrics
   */
  getQualityMetrics: async () => {
    const response = await apiClient.get('/manual-scoring/quality-metrics');
    return response.data;
  },

  /**
   * Export manual scoring data
   * @param {string} format - Export format ('json' or 'csv')
   * @param {Object} filters - Optional filters { gameType, startDate, endDate }
   * @returns {Promise<Object|string>} Response with export data
   */
  exportScoringData: async (format = 'json', filters = {}) => {
    const params = { format, ...filters };

    if (format === 'csv') {
      const response = await apiClient.get('/manual-scoring/export', {
        params,
        responseType: 'blob',
      });
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'manual-scores.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    }

    const response = await apiClient.get('/manual-scoring/export', { params });
    return response.data;
  },
};

export default manualScoringService;
