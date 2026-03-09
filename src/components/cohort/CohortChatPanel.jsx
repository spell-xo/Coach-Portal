import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import ChatPanel from '../wizard/ChatPanel';
import PeilWelcomeBanner from '../wizard/PeilWelcomeBanner';
import InputBox from '../wizard/InputBox';
import AnnotationListPanel from '../wizard/AnnotationListPanel';
import wizardService from '../../api/wizardService';

const COHORT_SUGGESTIONS = [
  'Give me an overview of this cohort',
  'Why are some drills scoring zero?',
  'Compare working vs failing drills',
  'Find the most anomalous drills',
  'What patterns distinguish the failures?',
];

const CohortChatPanel = ({ sessionId, sessionData }) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeFunctionCalls, setActiveFunctionCalls] = useState([]);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const abortRef = useRef(null);

  // Annotation state
  const [annotations, setAnnotations] = useState([]);
  const [savedAnnotations, setSavedAnnotations] = useState([]);
  const [viewVideoUrl, setViewVideoUrl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [saveDialog, setSaveDialog] = useState({ open: false, annotationId: null });
  const [saveForm, setSaveForm] = useState({ name: '', purpose: '', when_to_use: '', what_to_look_for: '' });

  // Reset state when session changes — load existing messages if resuming
  useEffect(() => {
    setError(null);
    setActiveFunctionCalls([]);
    setAnnotations([]);
    setSavedAnnotations([]);
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    // Load existing messages from sessionData when resuming a session
    if (sessionData?.messages?.length > 0) {
      const loaded = sessionData.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      setMessages(loaded);
      setShowSuggestions(false);
    } else {
      setMessages([]);
      setShowSuggestions(true);
    }
  }, [sessionId, sessionData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
      }
    };
  }, []);

  const openSaveDialog = (annotationId) => {
    setSaveForm({ name: '', purpose: '', when_to_use: '', what_to_look_for: '' });
    setSaveDialog({ open: true, annotationId });
  };

  const handleSaveAnnotation = async () => {
    const { annotationId } = saveDialog;
    const { name, purpose, when_to_use, what_to_look_for } = saveForm;
    const metadata = { purpose, when_to_use, what_to_look_for };
    try {
      await wizardService.saveAnnotation(annotationId, name || 'Saved annotation', metadata);
      setAnnotations((prev) => {
        const ann = prev.find((a) => a.id === annotationId);
        if (ann) {
          setSavedAnnotations((s) => [...s, { ...ann, saved: true, name: name || 'Saved annotation' }]);
        }
        return prev.filter((a) => a.id !== annotationId);
      });
      setSnackbar({ open: true, message: 'Annotation saved to library' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save annotation' });
    }
    setSaveDialog({ open: false, annotationId: null });
  };

  const handleDownloadTranscript = () => {
    if (messages.length === 0) return;
    const gameType = sessionData?.game_type || 'cohort';
    const dateStr = new Date().toISOString().slice(0, 10);
    const lines = [
      `Cohort Investigation — ${gameType.replace(/_/g, ' ')}`,
      `Exported: ${new Date().toLocaleString()}`,
      `Drills: ${sessionData?.drill_count || '?'} (${sessionData?.working_count || 0} working, ${sessionData?.failing_count || 0} failing)`,
      `Messages: ${messages.length}`,
      '\u2014'.repeat(40),
      '',
    ];
    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'You' : 'Peil';
      const time = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
      lines.push(`[${role}] ${time}`);
      lines.push(msg.content || '');
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohort-investigation-${gameType.toLowerCase()}-${dateStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendMessage = useCallback(
    async (text) => {
      if (isStreaming || !text.trim() || !sessionId) return;

      setError(null);
      setShowSuggestions(false);
      setIsStreaming(true);
      setActiveFunctionCalls([]);

      const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
      const assistantMsg = { role: 'assistant', content: '', isStreaming: true, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      try {
        // For cohort sessions, pass the session's drill_id (first drill) for routing
        const drillId = sessionData?.drills?.[0]?.drill_id || null;
        const { stream, abort } = wizardService.sendMessage(sessionId, drillId, text);
        abortRef.current = abort;

        for await (const event of stream) {
          switch (event.type) {
            case 'heartbeat':
              break;

            case 'session_id':
              break;

            case 'function_call':
              setActiveFunctionCalls((prev) => [...prev, event.content]);
              break;

            case 'function_result':
              setActiveFunctionCalls((prev) => prev.slice(1));
              break;

            case 'chunk':
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + event.content };
                }
                return updated;
              });
              break;

            case 'done':
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, isStreaming: false };
                }
                return updated;
              });
              break;

            case 'annotation_progress': {
              const data = event.content || event;
              setAnnotations((prev) => {
                const existing = prev.find((a) => a.id === data.annotation_id);
                if (existing) {
                  return prev.map((a) =>
                    a.id === data.annotation_id
                      ? { ...a, percent: data.percent, statusText: data.status_text, status: 'processing' }
                      : a
                  );
                }
                return [
                  ...prev,
                  {
                    id: data.annotation_id,
                    percent: data.percent,
                    statusText: data.status_text,
                    status: 'processing',
                    description: data.description || '',
                  },
                ];
              });
              break;
            }

            case 'annotation_complete': {
              const data = event.content || event;
              setAnnotations((prev) =>
                prev.map((a) =>
                  a.id === data.annotation_id
                    ? {
                        ...a,
                        status: 'completed',
                        videoUrl: data.video_url,
                        duration: data.duration,
                        frames: data.frames,
                        description: data.description || a.description,
                        percent: 100,
                      }
                    : a
                )
              );
              break;
            }

            case 'annotation_failed': {
              const data = event.content || event;
              setAnnotations((prev) =>
                prev.map((a) =>
                  a.id === data.annotation_id ? { ...a, status: 'failed', error: data.error } : a
                )
              );
              break;
            }

            case 'error':
              setError(event.content || 'An error occurred.');
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant' && !last.content) {
                  return updated.slice(0, -1);
                }
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, isStreaming: false };
                }
                return updated;
              });
              break;

            default:
              break;
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Cohort wizard stream error:', err);
        setError(err.message || 'Connection failed. Please try again.');
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && !last.content) {
            return updated.slice(0, -1);
          }
          if (last && last.role === 'assistant') {
            return [...updated.slice(0, -1), { ...last, isStreaming: false }];
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        setActiveFunctionCalls([]);
        abortRef.current = null;
      }
    },
    [isStreaming, sessionId, sessionData]
  );

  // Empty state before session
  if (!sessionId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          color: 'text.secondary',
        }}
      >
        <PeilWelcomeBanner sessionType="cohort" />
        <Typography variant="body2" textAlign="center" sx={{ maxWidth: 400, mt: 1 }}>
          Select a drill type and parameters on the left panel, then click "Start Investigation"
          to begin.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Chat Header */}
      {messages.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tooltip title="Download transcript">
            <IconButton size="small" onClick={handleDownloadTranscript} disabled={isStreaming}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Annotation List Panel */}
      <AnnotationListPanel
        annotations={annotations}
        savedAnnotations={savedAnnotations}
        onView={(url) => setViewVideoUrl(url)}
        onSave={(id) => openSaveDialog(id)}
        onDelete={(id) => {
          wizardService.deleteAnnotation(id).then(() => {
            setSavedAnnotations((prev) => prev.filter((a) => a.id !== id));
            setSnackbar({ open: true, message: 'Annotation deleted' });
          }).catch(() => {
            setSnackbar({ open: true, message: 'Failed to delete annotation' });
          });
        }}
      />

      {/* Error Banner */}
      {error && (
        <Box sx={{ px: 2, py: 1 }}>
          <Alert severity="error" onClose={() => setError(null)} sx={{ fontSize: '0.8rem' }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        activeFunctionCalls={activeFunctionCalls}
        isStreaming={isStreaming}
        annotations={annotations}
        sessionType="cohort"
        onAnnotationView={(url) => setViewVideoUrl(url)}
        onAnnotationSave={(id) => openSaveDialog(id)}
      />

      {/* Welcome Banner + Suggested Questions */}
      {messages.length === 0 && showSuggestions && !isStreaming && (
        <Box sx={{ px: 2, pb: 1 }}>
          <PeilWelcomeBanner sessionType="cohort" />
        </Box>
      )}
      {showSuggestions && !isStreaming && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <AutoAwesomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Suggested investigations
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {COHORT_SUGGESTIONS.map((question, index) => (
              <Chip
                key={index}
                label={question}
                size="small"
                variant="outlined"
                onClick={() => sendMessage(question)}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  height: 'auto',
                  '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
                  '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input Box */}
      <InputBox onSend={sendMessage} disabled={isStreaming || !sessionId} />

      {/* Annotation Video Dialog */}
      <Dialog
        open={Boolean(viewVideoUrl)}
        onClose={() => setViewVideoUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
          <Typography variant="subtitle1">Annotated Video</Typography>
          <IconButton size="small" onClick={() => setViewVideoUrl(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {viewVideoUrl && (
            <video
              src={viewVideoUrl}
              controls
              autoPlay
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Save Annotation Dialog */}
      <Dialog
        open={saveDialog.open}
        onClose={() => setSaveDialog({ open: false, annotationId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <SaveIcon />
          <Typography variant="h6" component="span">Save Annotation</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Name"
            placeholder="e.g. Ball tracking overlay"
            value={saveForm.name}
            onChange={(e) => setSaveForm((f) => ({ ...f, name: e.target.value }))}
            sx={{ mb: 1.5, mt: 0.5 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Purpose (optional)"
            placeholder="What does this annotation do?"
            value={saveForm.purpose}
            onChange={(e) => setSaveForm((f) => ({ ...f, purpose: e.target.value }))}
            sx={{ mb: 1.5 }}
          />
          <TextField
            fullWidth
            size="small"
            label="When to use (optional)"
            placeholder="When should this annotation be applied?"
            value={saveForm.when_to_use}
            onChange={(e) => setSaveForm((f) => ({ ...f, when_to_use: e.target.value }))}
            sx={{ mb: 1.5 }}
          />
          <TextField
            fullWidth
            size="small"
            label="What to look for (optional)"
            placeholder="Key indicators or patterns to check"
            value={saveForm.what_to_look_for}
            onChange={(e) => setSaveForm((f) => ({ ...f, what_to_look_for: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog({ open: false, annotationId: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAnnotation}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CohortChatPanel;
