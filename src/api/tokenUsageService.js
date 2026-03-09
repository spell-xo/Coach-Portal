import fetchWithAuth from './fetchWithAuth';

const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || 'https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api';

const getContentHeaders = () => ({
  'Content-Type': 'application/json',
});

const tokenUsageService = {
  /**
   * Get usage summary with optional filters
   */
  getSummary: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${AI_API_BASE}/usage/summary${qs ? `?${qs}` : ''}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch usage summary');
    }
    return response.json();
  },

  /**
   * Get usage broken down by user
   */
  getByUser: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${AI_API_BASE}/usage/by-user${qs ? `?${qs}` : ''}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch usage by user');
    }
    return response.json();
  },

  /**
   * Get usage broken down by tool
   */
  getByTool: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${AI_API_BASE}/usage/by-tool${qs ? `?${qs}` : ''}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch usage by tool');
    }
    return response.json();
  },

  /**
   * Get LLM errors with aggregation and filters
   */
  getErrors: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const response = await fetchWithAuth(`${AI_API_BASE}/usage/errors${qs ? `?${qs}` : ''}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch usage errors');
    }
    return response.json();
  },

  /**
   * Update model pricing
   */
  updateModelPricing: async (modelId, pricing) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models/${encodeURIComponent(modelId)}/pricing`, {
      method: 'PUT',
      headers: getContentHeaders(),
      body: JSON.stringify(pricing),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try {
        errorDetail = JSON.parse(errorText)?.detail || errorText;
      } catch {
        errorDetail = errorText;
      }
      throw new Error(errorDetail);
    }
    return response.json();
  },
};

export default tokenUsageService;
