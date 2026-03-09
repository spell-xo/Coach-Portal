import fetchWithAuth from './fetchWithAuth';

const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || 'https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api';

const getContentHeaders = () => ({
  'Content-Type': 'application/json',
});

const reprocessService = {
  /**
   * Trigger reprocessing of a drill.
   * Optionally pass a patch_id (CP-###) to reprocess with patched code.
   * Returns the pending reprocess result with comparison data.
   */
  triggerReprocess: async (videoId, reason = '', patchId = null) => {
    const body = { skip_yolo: true, reason };
    if (patchId) body.patch_id = patchId;

    const response = await fetchWithAuth(`${AI_API_BASE}/reprocess/drill/${videoId}`, {
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
        response.status === 404 ? 'Drill not found.' :
        `Reprocess error: ${errorDetail}`
      );
    }

    return response.json();
  },

  /**
   * Get the pending reprocess result for preview (comparison view).
   */
  getPreview: async (videoId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/reprocess/drill/${videoId}/preview`, {
      headers: getContentHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try {
        errorDetail = JSON.parse(errorText)?.detail || errorText;
      } catch {
        errorDetail = errorText;
      }
      throw new Error(
        response.status === 401 ? 'Session expired. Please log in again.' :
        `Preview error: ${errorDetail}`
      );
    }

    return response.json();
  },

  /**
   * Apply the pending reprocess result (archive current + overwrite scores).
   */
  applyResult: async (videoId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/reprocess/drill/${videoId}/apply`, {
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
        response.status === 404 ? 'No pending result found.' :
        `Apply error: ${errorDetail}`
      );
    }

    return response.json();
  },

  /**
   * Discard the pending reprocess result without applying.
   */
  discardResult: async (videoId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/reprocess/drill/${videoId}/pending`, {
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
        response.status === 404 ? 'No pending result found.' :
        `Discard error: ${errorDetail}`
      );
    }

    return response.json();
  },

  /**
   * List available sandbox patches, optionally filtered by game type.
   * Returns patches with patch_id, description, engineering_request_id, status, etc.
   */
  listPatches: async (gameType = null) => {
    const params = new URLSearchParams();
    if (gameType) params.set('game_type', gameType);
    params.set('limit', '50');

    const response = await fetchWithAuth(`${AI_API_BASE}/sandbox/patches?${params}`, {
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
        `Patch list error: ${errorDetail}`
      );
    }

    return response.json();
  },

  /**
   * Get reprocessing history for a drill.
   */
  getHistory: async (videoId, limit = 20) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/reprocess/drill/${videoId}/history?limit=${limit}`, {
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
        `History error: ${errorDetail}`
      );
    }

    return response.json();
  },
};

export default reprocessService;
