import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SummarizeIcon from '@mui/icons-material/Summarize';
import BugReportIcon from '@mui/icons-material/BugReport';
import ChatPanel from '../wizard/ChatPanel';
import InputBox from '../wizard/InputBox';
import BulkConfirmDialog from './BulkConfirmDialog';
import wizardService from '../../api/wizardService';

const PRESET_ACTIONS = [
  { label: 'Validate All', icon: <AutoFixHighIcon sx={{ fontSize: 14 }} />, action: 'validate' },
  { label: 'Summarize', icon: <SummarizeIcon sx={{ fontSize: 14 }} />, message: 'Give me a summary of the current drill set — how many, what types, score distribution, and any notable patterns.' },
  { label: 'Find Issues', icon: <BugReportIcon sx={{ fontSize: 14 }} />, message: 'Analyze this drill set and identify any issues — mismatched pattern counts, unusual scores, potential misclassifications, or drills that may need review.' },
];

const CommandCentreChat = ({ selectedDrills, currentFilters, totalFilteredCount, onStartValidation }) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [activeFunctionCalls, setActiveFunctionCalls] = useState([]);
  const [error, setError] = useState(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const abortRef = useRef(null);

  const createSessionIfNeeded = async () => {
    if (sessionId) return sessionId;

    try {
      const drillIds = selectedDrills.length > 0 ? selectedDrills : [];
      const context = {
        selected_count: selectedDrills.length,
        total_filtered: totalFilteredCount,
        filters: currentFilters,
      };

      const data = await wizardService.createCommandCentreSession(drillIds, context);
      setSessionId(data.session_id);
      return data.session_id;
    } catch (err) {
      setError(err.message || 'Failed to create session');
      return null;
    }
  };

  const sendMessage = useCallback(
    async (text) => {
      if (isStreaming || !text.trim()) return;

      setError(null);
      setIsStreaming(true);
      setActiveFunctionCalls([]);

      const sid = await createSessionIfNeeded();
      if (!sid) {
        setIsStreaming(false);
        return;
      }

      const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
      const assistantMsg = { role: 'assistant', content: '', isStreaming: true, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      try {
        const drillId = selectedDrills.length > 0 ? selectedDrills[0] : null;
        const { stream, abort } = wizardService.sendMessage(sid, drillId, text);
        abortRef.current = abort;

        for await (const event of stream) {
          switch (event.type) {
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
            case 'function_call':
              setActiveFunctionCalls((prev) => [...prev, event.content]);
              break;
            case 'function_result':
              setActiveFunctionCalls((prev) => prev.slice(1));
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
                if (last && last.role === 'assistant' && !last.content) return updated.slice(0, -1);
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
        setError(err.message || 'Connection failed.');
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && !last.content) return updated.slice(0, -1);
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
    [isStreaming, sessionId, selectedDrills, totalFilteredCount, currentFilters]
  );

  const handlePresetAction = (preset) => {
    if (preset.action === 'validate') {
      setBulkConfirmOpen(true);
    } else if (preset.message) {
      sendMessage(preset.message);
    }
  };

  const handleValidationConfirmed = (drillIds) => {
    setBulkConfirmOpen(false);
    if (onStartValidation) onStartValidation(drillIds);
  };

  const drillCount = selectedDrills.length || totalFilteredCount || 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Context Banner */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          {selectedDrills.length > 0
            ? `${selectedDrills.length} drill${selectedDrills.length !== 1 ? 's' : ''} selected`
            : totalFilteredCount > 0
              ? `${totalFilteredCount} drills in filtered view`
              : 'No drills in scope'
          }
        </Typography>
      </Box>

      {/* Error Banner */}
      {error && (
        <Box sx={{ px: 2, py: 1 }}>
          <Alert severity="error" sx={{ fontSize: '0.8rem' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        activeFunctionCalls={activeFunctionCalls}
        isStreaming={isStreaming}
        sessionType="command_centre"
      />

      {/* Preset Actions */}
      {messages.length === 0 && !isStreaming && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Quick actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {PRESET_ACTIONS.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                icon={preset.icon}
                size="small"
                variant="outlined"
                onClick={() => handlePresetAction(preset)}
                disabled={drillCount === 0}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input */}
      <InputBox onSend={sendMessage} disabled={isStreaming} />

      {/* Bulk Confirm Dialog */}
      <BulkConfirmDialog
        open={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={handleValidationConfirmed}
        drillIds={selectedDrills}
        totalFilteredCount={totalFilteredCount}
      />
    </Box>
  );
};

export default CommandCentreChat;
