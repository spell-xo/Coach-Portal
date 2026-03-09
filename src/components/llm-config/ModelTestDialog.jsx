import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import llmConfigService from '../../api/llmConfigService';

const DEFAULT_MESSAGE = 'Respond with exactly one sentence confirming your model name and that you are operational.';

const ERROR_TYPE_LABELS = {
  rate_limit: { label: 'Rate Limited', color: 'warning', hint: 'The provider is rate-limiting requests. Wait a moment and try again, or check quota limits.' },
  auth_error: { label: 'Auth Error', color: 'error', hint: 'The API key is invalid or lacks permissions. Check the provider API key configuration.' },
  invalid_api_key: { label: 'Invalid API Key', color: 'error', hint: 'The API key is not valid. Update it in the provider configuration.' },
  model_not_found: { label: 'Model Not Found', color: 'error', hint: 'The provider does not recognise this model ID. Check spelling or availability in your region.' },
  timeout: { label: 'Timeout', color: 'warning', hint: 'The request timed out. The model may be under heavy load — try again shortly.' },
  provider_unavailable: { label: 'Provider Unavailable', color: 'error', hint: 'The provider is not configured. Ensure the API key is set in the environment.' },
  unknown: { label: 'Error', color: 'error', hint: 'An unexpected error occurred. Check the error details below.' },
};

const ModelTestDialog = ({ open, onClose, modelId, provider }) => {
  const [message, setMessage] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    try {
      setTesting(true);
      setResult(null);
      const testMessage = useCustom && message.trim() ? message.trim() : null;
      const res = await llmConfigService.testModel(modelId, testMessage);
      setResult(res);
    } catch (err) {
      setResult({
        status: 'error',
        error_type: 'unknown',
        error: err.message || 'Request failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setMessage('');
    setUseCustom(false);
    onClose();
  };

  const errorInfo = result?.error_type ? ERROR_TYPE_LABELS[result.error_type] || ERROR_TYPE_LABELS.unknown : null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Test Model: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{modelId}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Send a test message to verify the model is reachable and the API key is valid.
        </Typography>

        {/* Message selection */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <Chip
              label="Default message"
              variant={!useCustom ? 'filled' : 'outlined'}
              color={!useCustom ? 'primary' : 'default'}
              size="small"
              onClick={() => setUseCustom(false)}
            />
            <Chip
              label="Custom message"
              variant={useCustom ? 'filled' : 'outlined'}
              color={useCustom ? 'primary' : 'default'}
              size="small"
              onClick={() => setUseCustom(true)}
            />
          </Box>
          {useCustom ? (
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Test message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message to send to the model..."
            />
          ) : (
            <Typography variant="body2" sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, fontStyle: 'italic', fontSize: '0.85rem' }}>
              {DEFAULT_MESSAGE}
            </Typography>
          )}
        </Box>

        {/* Result */}
        {result && (
          <>
            <Divider sx={{ my: 2 }} />
            {result.status === 'success' ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Model is operational
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {result.provider} &middot; {result.latency_ms}ms latency
                  {result.usage?.total_tokens ? ` · ${result.usage.total_tokens} tokens` : ''}
                </Typography>
              </Alert>
            ) : (
              <Alert severity={errorInfo?.color === 'warning' ? 'warning' : 'error'} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {errorInfo?.label || 'Error'}
                  </Typography>
                  {result.latency_ms != null && (
                    <Typography variant="caption" color="text.secondary">
                      ({result.latency_ms}ms)
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {errorInfo?.hint}
                </Typography>
              </Alert>
            )}

            {/* Response or error details */}
            {result.status === 'success' && result.response && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Response
                </Typography>
                <Typography variant="body2">{result.response}</Typography>
              </Box>
            )}
            {result.status === 'error' && result.error && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Error Details
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-word' }}>
                  {result.error}
                </Typography>
              </Box>
            )}

            {/* Token usage */}
            {result.usage && Object.keys(result.usage).length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                {result.usage.prompt_tokens != null && (
                  <Typography variant="caption" color="text.secondary">
                    Prompt: {result.usage.prompt_tokens}
                  </Typography>
                )}
                {result.usage.completion_tokens != null && (
                  <Typography variant="caption" color="text.secondary">
                    Completion: {result.usage.completion_tokens}
                  </Typography>
                )}
                {result.usage.total_tokens != null && (
                  <Typography variant="caption" color="text.secondary">
                    Total: {result.usage.total_tokens}
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={testing ? <CircularProgress size={16} /> : <PlayArrowIcon />}
          onClick={handleTest}
          disabled={testing || (useCustom && !message.trim())}
        >
          {testing ? 'Testing...' : 'Run Test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModelTestDialog;
