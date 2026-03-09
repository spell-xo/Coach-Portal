import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import llmConfigService from '../../api/llmConfigService';
import ModelFormDialog from './ModelFormDialog';
import ModelUsageDialog from './ModelUsageDialog';
import ModelTestDialog from './ModelTestDialog';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: 'success',
  deprecated: 'warning',
  retired: 'error',
};

const ModelCatalog = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editModel, setEditModel] = useState(null);
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageModelId, setUsageModelId] = useState(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testModel, setTestModel] = useState(null);

  // Deprecate dialog
  const [deprecateOpen, setDeprecateOpen] = useState(false);
  const [deprecateTarget, setDeprecateTarget] = useState(null);
  const [successor, setSuccessor] = useState('');
  const [deprecating, setDeprecating] = useState(false);

  // Retire confirm
  const [retireOpen, setRetireOpen] = useState(false);
  const [retireTarget, setRetireTarget] = useState(null);
  const [retiring, setRetiring] = useState(false);

  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await llmConfigService.getModels();
      setModels(res.data?.models || res.models || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const filteredModels = models.filter((m) => {
    const matchesSearch = !search ||
      m.model_id?.toLowerCase().includes(search.toLowerCase()) ||
      m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.provider?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRegister = () => {
    setFormMode('create');
    setEditModel(null);
    setFormOpen(true);
  };

  const handleEdit = (model) => {
    setFormMode('edit');
    setEditModel(model);
    setFormOpen(true);
  };

  const handleFormSave = async (data) => {
    try {
      if (formMode === 'create') {
        await llmConfigService.registerModel(data);
        toast.success('Model registered');
      } else {
        await llmConfigService.updateModel(editModel.model_id, data);
        toast.success('Model updated');
      }
      loadModels();
    } catch (err) {
      toast.error(err.message || 'Failed to save model');
      throw err; // re-throw so dialog stays open
    }
  };

  const handleDeprecateOpen = (model) => {
    setDeprecateTarget(model);
    setSuccessor('');
    setDeprecateOpen(true);
  };

  const handleDeprecate = async () => {
    try {
      setDeprecating(true);
      await llmConfigService.deprecateModel(deprecateTarget.model_id, {
        successor_model_id: successor || undefined,
      });
      toast.success(`Model "${deprecateTarget.model_id}" deprecated`);
      setDeprecateOpen(false);
      loadModels();
    } catch (err) {
      toast.error(err.message || 'Failed to deprecate model');
    } finally {
      setDeprecating(false);
    }
  };

  const handleRetireOpen = (model) => {
    setRetireTarget(model);
    setRetireOpen(true);
  };

  const handleRetire = async () => {
    try {
      setRetiring(true);
      await llmConfigService.retireModel(retireTarget.model_id);
      toast.success(`Model "${retireTarget.model_id}" retired`);
      setRetireOpen(false);
      loadModels();
    } catch (err) {
      toast.error(err.message || 'Failed to retire model');
    } finally {
      setRetiring(false);
    }
  };

  const handleUsage = (modelId) => {
    setUsageModelId(modelId);
    setUsageOpen(true);
  };

  const handleTest = (model) => {
    setTestModel(model);
    setTestOpen(true);
  };

  const activeModels = models.filter((m) => m.status !== 'retired');

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Model Catalog
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="deprecated">Deprecated</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleRegister}
              >
                Register Model
              </Button>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredModels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No models found.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Model ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Display Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Capabilities</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredModels.map((m) => (
                    <TableRow key={m.model_id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {m.model_id}
                        </Typography>
                      </TableCell>
                      <TableCell>{m.provider}</TableCell>
                      <TableCell>{m.display_name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={m.status || 'active'}
                          size="small"
                          color={STATUS_COLORS[m.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(m.capabilities || []).map((cap) => (
                            <Chip key={cap} label={cap} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {m.status !== 'retired' && (
                            <Tooltip title="Test model">
                              <IconButton size="small" color="primary" onClick={() => handleTest(m)}>
                                <PlayArrowIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(m)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {m.status === 'active' && (
                            <Tooltip title="Deprecate">
                              <IconButton size="small" color="warning" onClick={() => handleDeprecateOpen(m)}>
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {m.status !== 'retired' && (
                            <Tooltip title="Retire">
                              <IconButton size="small" color="error" onClick={() => handleRetireOpen(m)}>
                                <RemoveCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View usage">
                            <IconButton size="small" onClick={() => handleUsage(m.model_id)}>
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Register / Edit Dialog */}
      <ModelFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleFormSave}
        model={editModel}
        mode={formMode}
      />

      {/* Usage Dialog */}
      <ModelUsageDialog
        open={usageOpen}
        onClose={() => setUsageOpen(false)}
        modelId={usageModelId}
      />

      {/* Test Dialog */}
      <ModelTestDialog
        open={testOpen}
        onClose={() => setTestOpen(false)}
        modelId={testModel?.model_id}
        provider={testModel?.provider}
      />

      {/* Deprecate Dialog */}
      <Dialog open={deprecateOpen} onClose={() => setDeprecateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Deprecate Model</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Deprecate <strong>{deprecateTarget?.model_id}</strong>? It will still be selectable but shown with a warning.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Successor Model (optional)</InputLabel>
            <Select
              value={successor}
              onChange={(e) => setSuccessor(e.target.value)}
              label="Successor Model (optional)"
            >
              <MenuItem value="">None</MenuItem>
              {activeModels
                .filter((m) => m.model_id !== deprecateTarget?.model_id)
                .map((m) => (
                  <MenuItem key={m.model_id} value={m.model_id}>{m.model_id}</MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeprecateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleDeprecate}
            disabled={deprecating}
          >
            {deprecating ? 'Deprecating...' : 'Deprecate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Retire Confirm Dialog */}
      <Dialog open={retireOpen} onClose={() => setRetireOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Retire Model</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Retire <strong>{retireTarget?.model_id}</strong>? It will be hidden from all model selectors and cannot be used in new configurations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetireOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRetire}
            disabled={retiring}
          >
            {retiring ? 'Retiring...' : 'Retire'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ModelCatalog;
