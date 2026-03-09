import fetchWithAuth from './fetchWithAuth';

const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || 'https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api';

const getContentHeaders = () => ({
  'Content-Type': 'application/json',
});

const bulkJobService = {
  createJob: async ({ jobType, drillIds, config, sourceTag, sourceFilters }) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/bulk-jobs`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({
        job_type: jobType,
        drill_ids: drillIds,
        config,
        source_tag: sourceTag,
        source_filters: sourceFilters,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(
        response.status === 429 ? errorDetail :
        response.status === 401 ? 'Session expired. Please log in again.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },

  listJobs: async (status = null, limit = 20) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('limit', String(limit));

    const response = await fetchWithAuth(`${AI_API_BASE}/bulk-jobs?${params}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(`Error: ${errorDetail}`);
    }
    return response.json();
  },

  getJob: async (jobId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/bulk-jobs/${jobId}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(`Error: ${errorDetail}`);
    }
    return response.json();
  },

  cancelJob: async (jobId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/bulk-jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(`Error: ${errorDetail}`);
    }
    return response.json();
  },

  pauseJob: async (jobId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/bulk-jobs/${jobId}/pause`, {
      method: 'POST',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(`Error: ${errorDetail}`);
    }
    return response.json();
  },

  resumeJob: async (jobId, statuses = null) => {
    const options = {
      method: 'POST',
      headers: getContentHeaders(),
    };
    if (statuses) {
      options.body = JSON.stringify({ statuses });
    }
    const response = await fetchWithAuth(`${AI_API_BASE}/bulk-jobs/${jobId}/resume`, options);
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(`Error: ${errorDetail}`);
    }
    return response.json();
  },
};

export default bulkJobService;
