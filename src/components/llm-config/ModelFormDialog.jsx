import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Grid,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const SUGGESTED_CAPABILITIES = ['text', 'code', 'vision', 'function_calling', 'streaming', 'agentic'];

const PROVIDERS = [
  { value: 'vertex_ai', label: 'Vertex AI (Gemini)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI' },
];

const ModelFormDialog = ({ open, onClose, onSave, model, mode }) => {
  const [form, setForm] = useState({
    model_id: '',
    provider: 'vertex_ai',
    display_name: '',
    capabilities: [],
    context_window: '',
    max_output_tokens: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && model) {
        setForm({
          model_id: model.model_id || '',
          provider: model.provider || 'vertex_ai',
          display_name: model.display_name || '',
          capabilities: model.capabilities || [],
          context_window: model.context_window || '',
          max_output_tokens: model.max_output_tokens || '',
          notes: model.notes || '',
        });
      } else {
        setForm({
          model_id: '',
          provider: 'vertex_ai',
          display_name: '',
          capabilities: [],
          context_window: '',
          max_output_tokens: '',
          notes: '',
        });
      }
    }
  }, [open, mode, model]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = {
        provider: form.provider,
        display_name: form.display_name || undefined,
        capabilities: form.capabilities.length > 0 ? form.capabilities : undefined,
        context_window: form.context_window ? parseInt(form.context_window, 10) : undefined,
        max_output_tokens: form.max_output_tokens ? parseInt(form.max_output_tokens, 10) : undefined,
        notes: form.notes || undefined,
      };
      if (mode === 'create') {
        data.model_id = form.model_id;
      }
      await onSave(data);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const isValid = mode === 'create' ? form.model_id && form.provider : form.provider;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Register New Model' : 'Edit Model'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Model ID"
              value={form.model_id}
              onChange={(e) => setForm((f) => ({ ...f, model_id: e.target.value }))}
              disabled={mode === 'edit'}
              placeholder="e.g. gemini-2.5-flash"
              required={mode === 'create'}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Provider</InputLabel>
              <Select
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                label="Provider"
              >
                {PROVIDERS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Display Name"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="e.g. Gemini 2.5 Flash"
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={SUGGESTED_CAPABILITIES}
              value={form.capabilities}
              onChange={(e, newValue) => setForm((f) => ({ ...f, capabilities: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Capabilities" placeholder="Add capability" />
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              size="small"
              label="Context Window"
              type="number"
              value={form.context_window}
              onChange={(e) => setForm((f) => ({ ...f, context_window: e.target.value }))}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              size="small"
              label="Max Output Tokens"
              type="number"
              value={form.max_output_tokens}
              onChange={(e) => setForm((f) => ({ ...f, max_output_tokens: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Notes"
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || !isValid}
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Register' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModelFormDialog;
