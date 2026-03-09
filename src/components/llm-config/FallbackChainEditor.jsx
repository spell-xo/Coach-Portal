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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Collapse,
  Divider,
  Box,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import llmConfigService from '../../api/llmConfigService';
import toast from 'react-hot-toast';

const FallbackChainEditor = ({ component, chain: initialChain, modelsByProvider, providers, onReload }) => {
  const [chain, setChain] = useState(initialChain || []);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ provider: '', model: '' });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...chain];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setChain(updated);
    setDirty(true);
  };

  const handleMoveDown = (index) => {
    if (index >= chain.length - 1) return;
    const updated = [...chain];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setChain(updated);
    setDirty(true);
  };

  const handleRemove = (index) => {
    setChain((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const handleAdd = () => {
    if (!addForm.provider || !addForm.model) return;
    setChain((prev) => [...prev, { provider: addForm.provider, model: addForm.model }]);
    setAddForm({ provider: '', model: '' });
    setShowAdd(false);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await llmConfigService.updateConfig(component, {
        fallback_chain: chain,
      });
      toast.success('Fallback chain saved');
      setDirty(false);
      onReload();
    } catch (err) {
      toast.error(err.message || 'Failed to save fallback chain');
    } finally {
      setSaving(false);
    }
  };

  const addModels = modelsByProvider[addForm.provider] || [];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Fallback Chain
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {dirty && (
              <Button
                size="small"
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Chain'}
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowAdd(!showAdd)}
            >
              Add Fallback
            </Button>
          </Box>
        </Box>

        {chain.length === 0 && !showAdd ? (
          <Typography variant="body2" color="text.secondary">
            No fallback chain configured. If the primary model fails, no automatic fallback will occur.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Model</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chain.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{entry.provider}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {entry.model}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Move up">
                        <span>
                          <IconButton size="small" onClick={() => handleMoveUp(idx)} disabled={idx === 0}>
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <span>
                          <IconButton size="small" onClick={() => handleMoveDown(idx)} disabled={idx >= chain.length - 1}>
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => handleRemove(idx)}>
                          <DeleteIcon fontSize="small" />
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
            Add Fallback Entry
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Provider</InputLabel>
                <Select
                  value={addForm.provider}
                  onChange={(e) => {
                    const provider = e.target.value;
                    const models = modelsByProvider[provider] || [];
                    setAddForm({ provider, model: models[0]?.model_id || models[0] || '' });
                  }}
                  label="Provider"
                >
                  {providers.map((p) => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" onClick={handleAdd} disabled={!addForm.provider || !addForm.model}>
                  Add
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

export default FallbackChainEditor;
