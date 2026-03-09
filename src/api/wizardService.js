import fetchWithAuth from './fetchWithAuth';

const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || 'https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api';

const getContentHeaders = () => ({
  'Content-Type': 'application/json',
});

const wizardService = {
  /**
   * Transcribe audio using OpenAI Whisper via the AI backend.
   * Sends audio blob as multipart/form-data.
   * Returns the transcribed text string.
   */
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/upload`, {
      method: 'POST',
      body: formData,
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
        response.status === 400 ? errorDetail :
        response.status === 401 ? 'Session expired. Please log in again.' :
        response.status === 413 ? 'File too large (max 5MB).' :
        `Upload error: ${errorDetail}`
      );
    }

    return response.json();
  },

  transcribeAudio: async (audioBlob, filename = 'recording.webm') => {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename);

    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/transcribe`, {
      method: 'POST',
      body: formData,
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
        response.status === 403 ? 'You do not have permission to use transcription.' :
        response.status === 503 ? 'Transcription is not available.' :
        `Transcription error: ${errorDetail}`
      );
    }

    const data = await response.json();
    return data.text || '';
  },

  /**
   * Create a comparison session for 2-4 drills.
   * Returns { session_id, session_type, drills, title, created_at }
   */
  createComparisonSession: async (drillIds) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/comparison-session`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ drill_ids: drillIds }),
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
        response.status === 403 ? 'You do not have permission to use the wizard.' :
        response.status === 404 ? errorDetail :
        `Error: ${errorDetail}`
      );
    }

    return response.json();
  },

  /**
   * Create a command centre session for bulk drill operations.
   * Returns { session_id, session_type, drill_count, created_at }
   */
  createCommandCentreSession: async (drillIds, context = {}, title = null) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/command-centre-session`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ drill_ids: drillIds, context, title }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(
        response.status === 401 ? 'Session expired. Please log in again.' :
        response.status === 403 ? 'You do not have permission to use the wizard.' :
        `Error: ${errorDetail}`
      );
    }

    return response.json();
  },

  /**
   * Send a message and receive an SSE streaming response.
   * Uses fetch API (not EventSource) for POST with body and custom headers.
   * Returns an object with { stream, abort } where stream is an async generator.
   */
  sendMessage: (sessionId, drillId, message, { visionDebug = false, attachments = [] } = {}) => {
    const controller = new AbortController();

    const stream = async function* () {
      const response = await fetchWithAuth(`${AI_API_BASE}/wizard/message`, {
        method: 'POST',
        headers: getContentHeaders(),
        body: JSON.stringify({
          message,
          drill_id: drillId,
          ...(sessionId ? { session_id: sessionId } : {}),
          ...(visionDebug ? { vision_debug: true } : {}),
          ...(attachments.length > 0 ? { attachments } : {}),
        }),
        signal: controller.signal,
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
          response.status === 403 ? 'You do not have permission to use the wizard.' :
          response.status === 404 ? 'Drill not found.' :
          response.status === 429 ? 'Too many requests. Please wait a moment.' :
          `Error: ${errorDetail}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            yield data;
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim() && buffer.trim().startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.trim().slice(6));
          yield data;
        } catch {
          // Skip malformed final line
        }
      }
    };

    return { stream: stream(), abort: () => controller.abort() };
  },

  /**
   * Get wizard sessions for a drill, optionally filtered by session_type.
   */
  getSessions: async (drillId, limit = 20, offset = 0, sessionType = null) => {
    const params = new URLSearchParams();
    if (drillId) params.append('drill_id', drillId);
    if (sessionType) params.append('session_type', sessionType);
    params.append('limit', limit);
    params.append('offset', offset);

    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/sessions?${params.toString()}`, {
      headers: getContentHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wizard sessions');
    }

    return response.json();
  },

  /**
   * Get a single wizard session with full message history
   */
  getSession: async (sessionId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/sessions/${sessionId}`, {
      headers: getContentHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wizard session');
    }

    return response.json();
  },

  /**
   * Rename a wizard session
   */
  renameSession: async (sessionId, title) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: getContentHeaders(),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Failed to rename session');
    }

    return response.json();
  },

  /**
   * Delete a wizard session
   */
  deleteSession: async (sessionId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getContentHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete wizard session');
    }

    return response.json();
  },

  /**
   * Get annotations for a drill
   */
  getAnnotations: async (drillId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotations?drill_id=${drillId}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch annotations');
    }
    return response.json();
  },

  /**
   * Save an annotation to the library
   */
  saveAnnotation: async (annotationId, name, metadata) => {
    const body = { name };
    if (metadata?.purpose) body.purpose = metadata.purpose;
    if (metadata?.when_to_use) body.when_to_use = metadata.when_to_use;
    if (metadata?.what_to_look_for) body.what_to_look_for = metadata.what_to_look_for;
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotations/${annotationId}/save`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error('Failed to save annotation');
    }
    return response.json();
  },

  /**
   * Delete an annotation
   */
  deleteAnnotation: async (annotationId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotations/${annotationId}`, {
      method: 'DELETE',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete annotation');
    }
    return response.json();
  },

  /**
   * Get saved annotation scripts
   */
  getScripts: async (drillType, search) => {
    const params = new URLSearchParams();
    if (drillType) params.append('drill_type', drillType);
    if (search) params.append('search', search);
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotation-scripts?${params.toString()}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch scripts');
    }
    return response.json();
  },

  /**
   * Get a single annotation script
   */
  getScript: async (scriptId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotation-scripts/${scriptId}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch script');
    }
    return response.json();
  },

  /**
   * Create a new annotation script
   */
  createScript: async (data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotation-scripts`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create script');
    }
    return response.json();
  },

  /**
   * Update an annotation script
   */
  updateScript: async (scriptId, data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotation-scripts/${scriptId}`, {
      method: 'PUT',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update script');
    }
    return response.json();
  },

  /**
   * Copy an annotation script
   */
  copyScript: async (scriptId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotation-scripts/${scriptId}/copy`, {
      method: 'POST',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to copy script');
    }
    return response.json();
  },

  /**
   * Export annotation scripts as portable JSON.
   * Pass an array of IDs to export specific scripts, or omit to export all.
   */
  exportScripts: async (ids) => {
    const params = new URLSearchParams();
    if (ids?.length) params.append('ids', ids.join(','));
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotation-scripts/export?${params.toString()}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to export scripts');
    }
    return response.json();
  },

  /**
   * Import annotation scripts from JSON payload
   */
  importScripts: async (items, onConflict = 'skip') => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotation-scripts/import`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ items, on_conflict: onConflict }),
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
   * Delete an annotation script
   */
  deleteScript: async (scriptId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/annotation-scripts/${scriptId}`, {
      method: 'DELETE',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete script');
    }
    return response.json();
  },

  /**
   * Get analysis shortcuts from the library
   */
  getShortcuts: async (drillType, category, search) => {
    const params = new URLSearchParams();
    if (drillType) params.append('drill_type', drillType);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts?${params.toString()}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch shortcuts');
    }
    return response.json();
  },

  /**
   * Use an analysis shortcut (fetches full details and increments usage count)
   */
  useShortcut: async (shortcutId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts/${shortcutId}/use`, {
      method: 'POST',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to use shortcut');
    }
    return response.json();
  },

  /**
   * Get a single analysis shortcut with full workflow
   */
  getShortcut: async (shortcutId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts/${shortcutId}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch shortcut');
    }
    return response.json();
  },

  /**
   * Create a new analysis shortcut
   */
  createShortcut: async (data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create shortcut');
    }
    return response.json();
  },

  /**
   * Update an analysis shortcut
   */
  updateShortcut: async (shortcutId, data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts/${shortcutId}`, {
      method: 'PUT',
      headers: getContentHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update shortcut');
    }
    return response.json();
  },

  /**
   * Copy an analysis shortcut
   */
  copyShortcut: async (shortcutId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts/${shortcutId}/copy`, {
      method: 'POST',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to copy shortcut');
    }
    return response.json();
  },

  /**
   * Export analysis shortcuts as portable JSON.
   * Pass an array of IDs to export specific shortcuts, or omit to export all.
   */
  exportShortcuts: async (ids) => {
    const params = new URLSearchParams();
    if (ids?.length) params.append('ids', ids.join(','));
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts/export?${params.toString()}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to export shortcuts');
    }
    return response.json();
  },

  /**
   * Import analysis shortcuts from JSON payload
   */
  importShortcuts: async (items, onConflict = 'skip') => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts/import`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ items, on_conflict: onConflict }),
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
   * Delete an analysis shortcut
   */
  deleteShortcut: async (shortcutId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/analysis-shortcuts/${shortcutId}`, {
      method: 'DELETE',
      headers: getContentHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete shortcut');
    }
    return response.json();
  },
  /**
   * Create a cohort investigation session.
   * Supports two modes:
   * - Threshold mode: { game_type, score_threshold, max_drills }
   * - Manual mode: { drill_ids: [...] }
   * Returns { session_id, drill_count, working_count, failing_count, game_type }
   */
  createCohortSession: async ({ game_type, score_threshold, max_drills, drill_ids }) => {
    const body = {};
    if (drill_ids && drill_ids.length > 0) {
      body.drill_ids = drill_ids;
    } else {
      body.game_type = game_type;
      body.score_threshold = score_threshold ?? 0;
      body.max_drills = max_drills ?? 100;
    }

    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/cohort-session`, {
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
        response.status === 403 ? 'You do not have permission to use the wizard.' :
        response.status === 400 ? errorDetail :
        response.status === 404 ? errorDetail :
        `Error: ${errorDetail}`
      );
    }

    return response.json();
  },

  /**
   * Bulk check which drill IDs have existing Peil wizard sessions.
   * Returns { drillId: sessionCount, ... }
   */
  checkSessions: async (drillIds) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/sessions/bulk-check`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ drill_ids: drillIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to check sessions');
    }

    const data = await response.json();
    return data.results || {};
  },

  /**
   * Run Gemini validation manually on a drill video.
   * Returns the full validation result (classification, metrics, rationale).
   */
  validateDrill: async (drillId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/validate-drill`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ drill_id: drillId }),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail;
      try { errorDetail = JSON.parse(errorText)?.detail || errorText; } catch { errorDetail = errorText; }
      throw new Error(response.status === 401 ? 'Session expired.' : `Validation error: ${errorDetail}`);
    }
    return response.json();
  },

  /**
   * Get pipeline and manual validation data for a drill.
   */
  getValidation: async (drillId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/validate-drill/${drillId}`, {
      headers: getContentHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch validation');
    return response.json();
  },

  /**
   * Clear all manual validations for a drill.
   */
  clearValidation: async (drillId) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/validate-drill/${drillId}`, {
      method: 'DELETE',
      headers: getContentHeaders(),
    });
    if (!response.ok) throw new Error('Failed to clear validation');
    return response.json();
  },

  /**
   * Create a report session for natural language drill reporting.
   * Returns { session_id, session_type, drill_count, created_at }
   */
  createReportSession: async ({ scope, tag_name, tag_names, drill_ids, date_from, date_to, max_drills, title }) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/wizard/report-session`, {
      method: 'POST',
      headers: getContentHeaders(),
      body: JSON.stringify({ scope, tag_name, tag_names, drill_ids, date_from, date_to, max_drills, title }),
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
        response.status === 403 ? 'You do not have permission to use the wizard.' :
        response.status === 400 ? errorDetail :
        response.status === 404 ? errorDetail :
        `Error: ${errorDetail}`
      );
    }
    return response.json();
  },

  /**
   * Export a report artifact as CSV, JSON, or Markdown.
   * Triggers a file download in the browser.
   */
  exportReport: async (sessionId, reportId, format = 'csv') => {
    const response = await fetchWithAuth(
      `${AI_API_BASE}/wizard/sessions/${sessionId}/reports/${reportId}/export?format=${format}`
    );
    if (!response.ok) {
      throw new Error('Failed to export report');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'md' ? 'md' : format;
    a.download = `report-${reportId}.${ext}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Export a wizard session transcript as text, markdown, or PDF.
   * Triggers a file download in the browser.
   */
  exportTranscript: async (sessionId, format = 'txt') => {
    const response = await fetchWithAuth(
      `${AI_API_BASE}/wizard/sessions/${sessionId}/export?format=${format}`
    );
    if (!response.ok) {
      throw new Error('Failed to export transcript');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'md' ? 'md' : format;
    a.download = `transcript-${sessionId.slice(-8)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Submit an engineering investigation request directly.
   * Creates a request in the engineering pipeline for review and investigation.
   */
  submitEngineeringRequest: async (data) => {
    const response = await fetchWithAuth(`${AI_API_BASE}/engineering-requests`, {
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
      throw new Error(
        response.status === 401 ? 'Session expired. Please log in again.' :
        response.status === 403 ? 'You do not have permission to submit engineering requests.' :
        `Error: ${errorDetail}`
      );
    }

    return response.json();
  },
};

export default wizardService;
