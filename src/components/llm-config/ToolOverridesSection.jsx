import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Grid,
  Collapse,
  Divider,
  Box,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import llmConfigService from '../../api/llmConfigService';
import toast from 'react-hot-toast';

const ToolOverridesSection = ({ component, toolConfigs, modelsByProvider, providers, onReload }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    tool: '',
    provider: 'vertex_ai',
    model: '',
    temperature: 0.3,
    max_tokens: 8192,
  });
  const [saving, setSaving] = useState(false);
  const [deletingTool, setDeletingTool] = useState(null);

  const addModels = modelsByProvider[addForm.provider] || [];

  const handleSave = async () => {
    if (!addForm.tool || !addForm.provider || !addForm.model) return;
    try {
      setSaving(true);
      await llmConfigService.updateConfig(component, {
        tool: addForm.tool,
        provider: addForm.provider,
        model: addForm.model,
        parameters: {
          temperature: addForm.temperature,
          max_output_tokens: addForm.max_tokens,
        },
      });
      toast.success(`Tool override saved for "${addForm.tool}"`);
      setShowAdd(false);
      setAddForm({ tool: '', provider: 'vertex_ai', model: '', temperature: 0.3, max_tokens: 8192 });
      onReload();
    } catch (err) {
      toast.error(err.message || 'Failed to save tool override');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (toolName) => {
    try {
      setDeletingTool(toolName);
      await llmConfigService.updateConfig(component, {
        tool: toolName,
        enabled: false,
      });
      toast.success(`Tool override removed for "${toolName}"`);
      onReload();
    } catch (err) {
      toast.error(err.message || 'Failed to delete tool override');
    } finally {
      setDeletingTool(null);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Tool Overrides
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAdd(!showAdd)}
          >
            Add Override
          </Button>
        </Box>

        {toolConfigs.length === 0 && !showAdd ? (
          <Typography variant="body2" color="text.secondary">
            No tool-level overrides. All tools use the component's default model.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tool Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Model</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Temperature</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Max Tokens</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {toolConfigs.map((tc) => (
                  <TableRow key={tc.tool}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {tc.tool}
                      </Typography>
                    </TableCell>
                    <TableCell>{tc.provider}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {tc.model}
                      </Typography>
                    </TableCell>
                    <TableCell>{tc.parameters?.temperature ?? '-'}</TableCell>
                    <TableCell>{tc.parameters?.max_output_tokens ?? '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete override">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(tc.tool)}
                          disabled={deletingTool === tc.tool}
                        >
                          {deletingTool === tc.tool ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Collapse in={showAdd}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            New Tool Override
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Tool Name"
                value={addForm.tool}
                onChange={(e) => setAddForm((f) => ({ ...f, tool: e.target.value }))}
                placeholder="e.g. generate_code"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Provider</InputLabel>
                <Select
                  value={addForm.provider}
                  onChange={(e) => {
                    const provider = e.target.value;
                    const models = modelsByProvider[provider] || [];
                    setAddForm((f) => ({
                      ...f,
                      provider,
                      model: models[0]?.model_id || models[0] || '',
                    }));
                  }}
                  label="Provider"
                >
                  {providers.map((p) => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Model</InputLabel>
                <Select
                  value={addForm.model}
                  onChange={(e) => setAddForm((f) => ({ ...f, model: e.target.value }))}
                  label="Model"
                  disabled={!addForm.provider}
                >
                  {addModels.map((m) => {
                    const id = m.model_id || m;
                    const label = m.display_name || id;
                    return <MenuItem key={id} value={id}>{label}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="caption" color="text.secondary">
                Temp: {addForm.temperature}
              </Typography>
              <Slider
                value={addForm.temperature}
                onChange={(e, v) => setAddForm((f) => ({ ...f, temperature: v }))}
                min={0}
                max={1}
                step={0.1}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Max Tokens"
                type="number"
                value={addForm.max_tokens}
                onChange={(e) => setAddForm((f) => ({ ...f, max_tokens: parseInt(e.target.value, 10) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  disabled={saving || !addForm.tool || !addForm.model}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button size="small" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ToolOverridesSection;
