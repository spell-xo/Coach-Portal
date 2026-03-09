import fetchWithAuth from './fetchWithAuth';

const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || 'https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api';

const getContentHeaders = () => ({
  'Content-Type': 'application/json',
});

const llmConfigService = {
  /**
   * Get all LLM configs for all components
   */
  getConfigs: async () => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/configs`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch LLM configs');
    }
    return response.json();
  },

  /**
   * Get LLM config for a specific component
   */
  getComponentConfig: async (component) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/configs/${component}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch config for ${component}`);
    }
    return response.json();
  },

  /**
   * Update default config for a component
   */
  updateConfig: async (component, data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/configs/${component}`, {
      method: 'PUT',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
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

  /**
   * Update a tier-specific override for a component
   */
  updateTierOverride: async (component, tier, data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/configs/${component}/${tier}`, {
      method: 'PUT',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
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

  /**
   * Delete a tier-specific override for a component
   */
  deleteTierOverride: async (component, tier) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/configs/${component}/${tier}`, {
      method: 'DELETE',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete tier override for ${component}/${tier}`);
    }
    return response.json();
  },

  /**
   * Get provider status (which providers have API keys configured)
   */
  getProviderStatus: async () => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/status`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch provider status');
    }
    return response.json();
  },

  /**
   * Get all models from the catalog, optionally filtered
   */
  getModels: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.capability) params.append('capability', filters.capability);
    const qs = params.toString();
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models${qs ? `?${qs}` : ''}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    return response.json();
  },

  /**
   * Get a single model by ID
   */
  getModel: async (modelId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models/${encodeURIComponent(modelId)}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch model ${modelId}`);
    }
    return response.json();
  },

  /**
   * Register a new model in the catalog
   */
  registerModel: async (data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
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

  /**
   * Update an existing model
   */
  updateModel: async (modelId, data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models/${encodeURIComponent(modelId)}`, {
      method: 'PUT',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
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

  /**
   * Deprecate a model (set successor)
   */
  deprecateModel: async (modelId, data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models/${encodeURIComponent(modelId)}/deprecate`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
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

  /**
   * Retire a model (remove from active use)
   */
  retireModel: async (modelId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models/${encodeURIComponent(modelId)}/retire`, {
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
      throw new Error(errorDetail);
    }
    return response.json();
  },

  /**
   * Get usage information for a model (which components reference it)
   */
  getModelUsage: async (modelId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models/${encodeURIComponent(modelId)}/usage`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch usage for model ${modelId}`);
    }
    return response.json();
  },

  /**
   * Test a model by sending a prompt and checking connectivity / API key validity
   */
  testModel: async (modelId, message) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/llm/models/${encodeURIComponent(modelId)}/test`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify(message ? { message } : {}),
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

export default llmConfigService;
