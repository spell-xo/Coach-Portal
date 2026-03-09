import fetchWithAuth from './fetchWithAuth';

const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || 'https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api';

const getContentHeaders = () => ({
  'Content-Type': 'application/json',
});

const tagService = {
  listTags: async () => {
    const response = await fetchWithAuth(`${AI_API_BASE}/tags`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(
        response.status === 401 ? 'Session expired. Please log in again.' :
        response.status === 403 ? 'Permission denied.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },

  createTag: async (tagName, drillIds = []) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/tags`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ tag_name: tagName, drill_ids: drillIds }),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(
        response.status === 409 ? `Tag "${tagName}" already exists.` :
        response.status === 401 ? 'Session expired. Please log in again.' :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },

  updateTag: async (tagName, changes) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/tags/${encodeURIComponent(tagName)}`, {
      method: 'PUT',
      headers: getContentHeaders(),
      body: JSON.stringify(changes),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(`Error: ${errorDetail}`);
    }
    return response.json();
  },

  deleteTag: async (tagName) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/tags/${encodeURIComponent(tagName)}`, {
      method: 'DELETE',
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

  getTagDrills: async (tagName) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/tags/${encodeURIComponent(tagName)}/drills`, {
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

  bulkApply: async (tagName, drillIds, createIfMissing = true) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/tags/bulk-apply`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({
        tag_name: tagName,
        drill_ids: drillIds,
        create_if_missing: createIfMissing,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(`Error: ${errorDetail}`);
    }
    return response.json();
  },
};

export default tagService;
