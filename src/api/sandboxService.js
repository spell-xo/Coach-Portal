import fetchWithAuth from './fetchWithAuth';

const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || 'https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api';

const getContentHeaders = () => ({
  'Content-Type': 'application/json',
});

const sandboxService = {
  /**
   * Run a sandbox test for a patch against specific drills
   */
  runTest: async (patchId, drillIds, gameType) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/run`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ patch_id: patchId, drill_ids: drillIds, ...(gameType ? { game_type: gameType } : {}) }),
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
        response.status === 403 ? 'You do not have permission to run sandbox tests.' :
        response.status === 429 ? 'Rate limit exceeded. Please wait before running more tests.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },

  /**
   * Run a validation batch test across many drills of a given type
   */
  runValidation: async (patchId, gameType, sampleSize) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/validate`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ patch_id: patchId, game_type: gameType, sample_size: sampleSize }),
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
        response.status === 403 ? 'You do not have permission to run validation.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },

  /**
   * List sandbox runs with optional filters
   */
  listRuns: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.patch_id) params.append('patch_id', filters.patch_id);
    if (filters.drill_type) params.append('drill_type', filters.drill_type);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/runs?${params.toString()}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch sandbox runs');
    }
    return response.json();
  },

  /**
   * Get a single sandbox run with full details
   */
  getRun: async (runId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/runs/${runId}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch sandbox run');
    }
    return response.json();
  },

  /**
   * List code patches with optional filters
   */
  listPatches: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.drill_type) params.append('drill_type', filters.drill_type);
    if (filters.chain_id) params.append('chain_id', filters.chain_id);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/patches?${params.toString()}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patches');
    }
    return response.json();
  },

  /**
   * Get a single patch with full details
   */
  getPatch: async (patchId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/patches/${patchId}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patch');
    }
    return response.json();
  },

  /**
   * List drills available for sandbox testing
   */
  listDrills: async (gameType, limit = 20) => {
    const params = new URLSearchParams();
    params.append('game_type', gameType);
    if (limit) params.append('limit', limit);
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/drills?${params.toString()}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch drills for testing');
    }
    return response.json();
  },

  /**
   * Update a patch's status
   */
  updatePatchStatus: async (patchId, status) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/patches/${patchId}/status`, {
      method: 'PUT',
      headers: getContentHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update patch status');
    }
    return response.json();
  },

  /**
   * Propose a patch for integration (triggers DA review)
   */
  proposeForIntegration: async (patchId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/propose/${patchId}`, {
      method: 'POST',
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
        response.status === 403 ? 'You do not have permission to propose patches.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },
};

export default sandboxService;
