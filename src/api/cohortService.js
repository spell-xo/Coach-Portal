import fetchWithAuth from './fetchWithAuth';

const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || 'https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api';

const getContentHeaders = () => ({
  'Content-Type': 'application/json',
});

const cohortService = {
  /**
   * Get available game types with drill counts
   */
  getGameTypes: async () => {
    const response = await fetchWithAuth(`${AI_API_BASE}/cohort/game-types`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try {
        errorDetail = JSON.parse(errorText)?.detail || errorText;
      } catch {
        errorDetail = errorText;
      }
      throw new Error(
        response.status === 401 ? 'Session expired. Please log in again.' :
        response.status === 403 ? 'You do not have permission to access cohort analysis.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },

  /**
   * Launch a cohort analysis
   */
  analyze: async (gameType, scoreThreshold = 0, maxDrills = 100, dateFrom = null, dateTo = null) => {
    const body = {
      game_type: gameType,
      score_threshold: scoreThreshold,
      max_drills: maxDrills,
    };
    if (dateFrom) body.date_from = dateFrom;
    if (dateTo) body.date_to = dateTo;

    const response = await fetchWithAuth(`${AI_API_BASE}/cohort/analyze`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try {
        errorDetail = JSON.parse(errorText)?.detail || errorText;
      } catch {
        errorDetail = errorText;
      }
      throw new Error(
        response.status === 401 ? 'Session expired. Please log in again.' :
        response.status === 403 ? 'You do not have permission to run cohort analysis.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },

  /**
   * List past analyses (summary only)
   */
  listAnalyses: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.game_type) params.append('game_type', filters.game_type);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    const response = await fetchWithAuth(`${AI_API_BASE}/cohort/analyses?${params.toString()}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch cohort analyses');
    }
    return response.json();
  },

  /**
   * Get a single analysis with full data
   */
  getAnalysis: async (analysisId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/cohort/analyses/${analysisId}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch cohort analysis');
    }
    return response.json();
  },

  /**
   * Get just the clusters from an analysis
   */
  getClusters: async (analysisId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/cohort/analyses/${analysisId}/clusters`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch clusters');
    }
    return response.json();
  },

  /**
   * Delete an analysis
   */
  deleteAnalysis: async (analysisId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/cohort/analyses/${analysisId}`, {
      method: 'DELETE',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try {
        errorDetail = JSON.parse(errorText)?.detail || errorText;
      } catch {
        errorDetail = errorText;
      }
      throw new Error(
        response.status === 401 ? 'Session expired. Please log in again.' :
        response.status === 403 ? 'You do not have permission to delete analyses.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },
};

export default cohortService;
