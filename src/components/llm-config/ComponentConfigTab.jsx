import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Grid,
  Tooltip,
  Collapse,
  Divider,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import llmConfigService from '../../api/llmConfigService';
import FallbackChainEditor from './FallbackChainEditor';
import ToolOverridesSection from './ToolOverridesSection';
import VisionToolsConfig from './VisionToolsConfig';
import toast from 'react-hot-toast';

const TIERS = [
  { value: 'platform_engineering_admin', label: 'Platform Engineering Admin' },
  { value: 'platform_engineering', label: 'Platform Engineering' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'support_agent', label: 'Support Agent' },
];

const formatTierLabel = (tier) => {
  const found = TIERS.find((t) => t.value === tier);
  return found ? found.label : tier;
};

// Components that support fallback chains
const FALLBACK_COMPONENTS = ['wizard', 'askdev', 'code_editor', 'devil_advocate', 'investigation', 'quick_fix_patch', 'ai_coach_chat'];
// Components that support tool overrides
const TOOL_OVERRIDE_COMPONENTS = ['wizard'];
// Components that support vision tools
const VISION_COMPONENTS = ['investigation', 'wizard'];

const ComponentConfigTab = ({
  component,
  config,
  toolConfigs,
  modelsByProvider,
  allModels,
  providers,
  tiers,
  providerStatus,
  warnings,
  onReload,
}) => {
  const [defaultForm, setDefaultForm] = useState({
    provider: 'vertex_ai',
    model: '',
    temperature: 0.3,
    max_tokens: 8192,
  });
  const [saving, setSaving] = useState(false);

  const [showAddOverride, setShowAddOverride] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    tier: 'platform_engineering',
    provider: 'vertex_ai',
    model: '',
    temperature: 0.3,
    max_tokens: 8192,
  });
  const [savingOverride, setSavingOverride] = useState(false);
  const [deletingTier, setDeletingTier] = useState(null);

  const tierOverrides = config?.overrides || {};

  // Update form when config changes
  useEffect(() => {
    if (config?.default) {
      const d = config.default;
      setDefaultForm({
        provider: d.provider || 'vertex_ai',
        model: d.model || '',
        temperature: d.parameters?.temperature ?? 0.3,
        max_tokens: d.parameters?.max_output_tokens ?? 8192,
      });
    }
    setShowAddOverride(false);
  }, [config]);

  const getModelsForProvider = (provider) => {
    const models = modelsByProvider[provider] || [];
    // Return model objects, filtering out retired models for selection
    return models.filter((m) => m.status !== 'retired');
  };

  const availableModels = getModelsForProvider(defaultForm.provider);
  const overrideModels = getModelsForProvider(overrideForm.provider);

  const renderModelMenuItem = (m) => {
    const id = m.model_id || m;
    const label = m.display_name || id;
    const isDeprecated = m.status === 'deprecated';
    return (
      <MenuItem key={id} value={id}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {label}
          {isDeprecated && (
            <WarningAmberIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          )}
        </Box>
      </MenuItem>
    );
  };

  const handleSaveDefault = async () => {
    try {
      setSaving(true);
      const result = await llmConfigService.updateConfig(component, {
        provider: defaultForm.provider,
        model: defaultForm.model,
        parameters: {
          temperature: defaultForm.temperature,
          max_output_tokens: defaultForm.max_tokens,
        },
      });
      const resWarnings = result?.warnings || [];
      if (resWarnings.length > 0) {
        toast.success('Default config saved (with warnings)');
      } else {
        toast.success('Default config saved');
      }
      onReload();
    } catch (err) {
      toast.error(err.message || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverride = async () => {
    try {
      setSavingOverride(true);
      await llmConfigService.updateTierOverride(component, overrideForm.tier, {
        provider: overrideForm.provider,
        model: overrideForm.model,
        parameters: {
          temperature: overrideForm.temperature,
          max_output_tokens: overrideForm.max_tokens,
        },
      });
      toast.success(`Override saved for ${formatTierLabel(overrideForm.tier)}`);
      setShowAddOverride(false);
      onReload();
    } catch (err) {
      toast.error(err.message || 'Failed to save override');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (tier) => {
    try {
      setDeletingTier(tier);
      await llmConfigService.deleteTierOverride(component, tier);
      toast.success(`Override removed for ${formatTierLabel(tier)}`);
      onReload();
    } catch (err) {
      toast.error(err.message || 'Failed to delete override');
    } finally {
      setDeletingTier(null);
    }
  };

  const providerList = providerStatus?.providers || providerStatus || {};

  return (
    <>
      {/* Deprecation warnings */}
      {warnings && warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {warnings.map((w, i) => (
            <Typography key={i} variant="body2">{w}</Typography>
          ))}
        </Alert>
      )}

      {/* Default Config */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Default Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Provider</InputLabel>
                <Select
                  value={defaultForm.provider}
                  onChange={(e) => {
                    const provider = e.target.value;
                    const models = getModelsForProvider(provider);
                    setDefaultForm((f) => ({
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Model</InputLabel>
                <Select
                  value={defaultForm.model}
                  onChange={(e) => setDefaultForm((f) => ({ ...f, model: e.target.value }))}
                  label="Model"
                >
                  {availableModels.map(renderModelMenuItem)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Temperature: {defaultForm.temperature}
              </Typography>
              <Slider
                value={defaultForm.temperature}
                onChange={(e, v) => setDefaultForm((f) => ({ ...f, temperature: v }))}
                min={0}
                max={1}
                step={0.1}
                valueLabelDisplay="auto"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Max Tokens"
                type="number"
                value={defaultForm.max_tokens}
                onChange={(e) => setDefaultForm((f) => ({ ...f, max_tokens: parseInt(e.target.value, 10) || 0 }))}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveDefault}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Default'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Fallback Chain (for applicable components) */}
      {FALLBACK_COMPONENTS.includes(component) && (
        <FallbackChainEditor
          component={component}
          chain={config?.default?.fallback_chain || []}
          modelsByProvider={modelsByProvider}
          providers={providers}
          onReload={onReload}
        />
      )}

      {/* Vision Tools (for investigation and wizard) */}
      {VISION_COMPONENTS.includes(component) && (
        <VisionToolsConfig
          component={component}
          config={config}
          allModels={allModels}
          onReload={onReload}
        />
      )}

      {/* Tier Overrides */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Tier Overrides
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowAddOverride(!showAddOverride)}
            >
              Add Override
            </Button>
          </Box>

          {Object.keys(tierOverrides).length === 0 && !showAddOverride ? (
            <Typography variant="body2" color="text.secondary">
              No tier overrides configured. All tiers use the default config above.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Model</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Temperature</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Max Tokens</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(tierOverrides).map(([tier, cfg]) => (
                    <TableRow key={tier}>
                      <TableCell>
                        <Chip label={formatTierLabel(tier)} size="small" />
                      </TableCell>
                      <TableCell>{cfg.provider}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {cfg.model}
                        </Typography>
                      </TableCell>
                      <TableCell>{cfg.parameters?.temperature ?? '-'}</TableCell>
                      <TableCell>{cfg.parameters?.max_output_tokens ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete override">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteOverride(tier)}
                            disabled={deletingTier === tier}
                          >
                            {deletingTier === tier ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Collapse in={showAddOverride}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              New Tier Override
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tier</InputLabel>
                  <Select
                    value={overrideForm.tier}
                    onChange={(e) => setOverrideForm((f) => ({ ...f, tier: e.target.value }))}
                    label="Tier"
                  >
                    {(tiers || TIERS).map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={overrideForm.provider}
                    onChange={(e) => {
                      const provider = e.target.value;
                      const models = getModelsForProvider(provider);
                      setOverrideForm((f) => ({
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
                    value={overrideForm.model}
                    onChange={(e) => setOverrideForm((f) => ({ ...f, model: e.target.value }))}
                    label="Model"
                  >
                    {overrideModels.map(renderModelMenuItem)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Typography variant="caption" color="text.secondary">
                  Temp: {overrideForm.temperature}
                </Typography>
                <Slider
                  value={overrideForm.temperature}
                  onChange={(e, v) => setOverrideForm((f) => ({ ...f, temperature: v }))}
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
                  value={overrideForm.max_tokens}
                  onChange={(e) => setOverrideForm((f) => ({ ...f, max_tokens: parseInt(e.target.value, 10) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveOverride}
                    disabled={savingOverride}
                  >
                    {savingOverride ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="small" onClick={() => setShowAddOverride(false)}>
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Tool Overrides (for applicable components) */}
      {TOOL_OVERRIDE_COMPONENTS.includes(component) && (
        <ToolOverridesSection
          component={component}
          toolConfigs={toolConfigs || []}
          modelsByProvider={modelsByProvider}
          providers={providers}
          onReload={onReload}
        />
      )}

      {/* Provider Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Provider Status
          </Typography>
          <Grid container spacing={2}>
            {providers.map((p) => {
              const status = providerList[p.value];
              const configured = status?.available || status === true;
              return (
                <Grid item xs={12} sm={4} key={p.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    {configured ? (
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <CancelIcon sx={{ color: 'error.main' }} />
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{p.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {configured ? 'API key configured' : 'No API key found'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </>
  );
};

export default ComponentConfigTab;
