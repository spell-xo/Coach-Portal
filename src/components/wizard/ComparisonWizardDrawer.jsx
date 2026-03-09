import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ChatPanel from './ChatPanel';
import InputBox from './InputBox';
import wizardService from '../../api/wizardService';

const DRAWER_WIDTH = 480;

const LABEL_COLORS = {
  A: { bg: '#e3f2fd', border: '#1976d2', text: '#1565c0' },
  B: { bg: '#e8f5e9', border: '#388e3c', text: '#2e7d32' },
  C: { bg: '#fff3e0', border: '#f57c00', text: '#e65100' },
  D: { bg: '#f3e5f5', border: '#7b1fa2', text: '#6a1b9a' },
};

const COMPARISON_SUGGESTIONS = [
  'Why do these drills have different scores?',
  'Are there version or configuration differences?',
  'Compare the activity detection across these drills',
  'Check for cone detection discrepancies',
];

const ComparisonWizardDrawer = ({ open, onClose, drillIds, drillData }) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [drills, setDrills] = useState([]);
  const [activeFunctionCalls, setActiveFunctionCalls] = useState([]);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const abortRef = useRef(null);

  // Create comparison session when drawer opens
  useEffect(() => {
    if (open && drillIds && drillIds.length >= 2 && !sessionId && !initializing) {
      createSession();
    }
  }, [open, drillIds]);

  // Reset when drawer closes
  useEffect(() => {
    if (!open) {
      setSessionId(null);
      setDrills([]);
      setMessages([]);
      setError(null);
      setShowSuggestions(true);
      setInitializing(false);
      if (abortRef.current) {
        abortRef.current();
        abortRef.current = null;
      }
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
      }
    };
  }, []);

  const createSession = async () => {
    setInitializing(true);
    setError(null);
    try {
      const data = await wizardService.createComparisonSession(drillIds);
      setSessionId(data.session_id);
      setDrills(data.drills || []);
    } catch (err) {
      console.error('Failed to create comparison session:', err);
      setError(err.message || 'Failed to create comparison session.');
    } finally {
      setInitializing(false);
    }
  };

  const handleDownloadConversation = () => {
    if (messages.length === 0) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const drillLabels = drills.map((d) => `${d.label}:${d.game_type}`).join(', ');
    const lines = [
      `Drill Comparison Wizard — ${drillLabels}`,
      `Exported: ${new Date().toLocaleString()}`,
      `Drills: ${drills.length}`,
      `Messages: ${messages.length}`,
      '\u2014'.repeat(40),
      '',
    ];

    drills.forEach((d) => {
      const score = d.total_score != null ? `${Math.round(d.total_score)}%` : 'N/A';
      lines.push(`Drill ${d.label}: ${d.game_type} — ${score}`);
    });
    lines.push('');

    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'You' : 'Wizard';
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
    a.download = `wizard-comparison-${dateStr}.txt`;
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
        // For comparison sessions, drill_id is the first drill's ID (backend uses session context)
        const drillId = drills.length > 0 ? drills[0].drill_id : null;
        const { stream, abort } = wizardService.sendMessage(sessionId, drillId, text);
        abortRef.current = abort;

        for await (const event of stream) {
          switch (event.type) {
            case 'heartbeat':
              break;
            case 'session_id':
              // Already have session_id from comparison session creation
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
        console.error('Comparison wizard stream error:', err);
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
    [isStreaming, sessionId, drills]
  );

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 56,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          Drill Comparison Wizard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {messages.length > 0 && (
            <Tooltip title="Download conversation">
              <IconButton size="small" onClick={handleDownloadConversation} disabled={isStreaming}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Drill Roster */}
      {drills.length > 0 && (
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {drills.map((drill) => {
              const colors = LABEL_COLORS[drill.label] || LABEL_COLORS.A;
              const score = drill.total_score != null ? `${Math.round(drill.total_score)}%` : 'N/A';
              const displayType = (drill.game_type || 'Unknown').replace(/_/g, ' ');

              // Look up extra data from drillData prop if available
              const extra = drillData?.find((d) => d.drillId === drill.drill_id || d.drillId === drill.original_drill_id);
              const date = extra?.date ? new Date(extra.date).toLocaleDateString() : '';

              return (
                <Chip
                  key={drill.label}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: colors.border,
                          color: '#fff',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          flexShrink: 0,
                        }}
                      >
                        {drill.label}
                      </Box>
                      <Box component="span" sx={{ fontSize: '0.7rem' }}>
                        {displayType} {score} {date && `(${date})`}
                      </Box>
                    </Box>
                  }
                  size="small"
                  sx={{
                    bgcolor: colors.bg,
                    borderColor: colors.border,
                    height: 'auto',
                    '& .MuiChip-label': { py: 0.5, px: 0.75 },
                  }}
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Error Banner */}
      {error && (
        <Box sx={{ px: 2, py: 1 }}>
          <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Initializing state */}
      {initializing && (
        <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Setting up comparison session...
          </Typography>
        </Box>
      )}

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        activeFunctionCalls={activeFunctionCalls}
        isStreaming={isStreaming}
      />

      {/* Suggested Questions */}
      {showSuggestions && !isStreaming && sessionId && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Suggested comparisons
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {COMPARISON_SUGGESTIONS.map((question, index) => (
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
    </Drawer>
  );
};

export { DRAWER_WIDTH as COMPARISON_DRAWER_WIDTH };
export default ComparisonWizardDrawer;
