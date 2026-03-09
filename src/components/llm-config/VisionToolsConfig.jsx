import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import llmConfigService from '../../api/llmConfigService';
import toast from 'react-hot-toast';

const VisionToolsConfig = ({ component, config, allModels, onReload }) => {
  const [saving, setSaving] = useState(false);
  const [selectedVisionModel, setSelectedVisionModel] = useState('');

  const defaultConfig = config?.default || {};
  const visionEnabled = defaultConfig.vision_tools_enabled || false;
  const currentModel = defaultConfig.model || '';
  const currentProvider = defaultConfig.provider || '';

  // Check if the current default model has "vision" capability
  const currentModelDoc = (allModels || []).find((m) => m.model_id === currentModel);
  const modelHasVision = currentModelDoc?.capabilities?.includes('vision') || false;

  // Get all active models with vision capability
  const visionModels = (allModels || []).filter(
    (m) => m.capabilities?.includes('vision') && m.status !== 'retired'
  );

  const handleToggle = async (enabled) => {
    try {
      setSaving(true);
      await llmConfigService.updateConfig(component, {
        vision_tools_enabled: enabled,
      });
      toast.success(enabled ? 'Vision tools enabled' : 'Vision tools disabled');
      onReload();
    } catch (err) {
      toast.error(err.message || 'Failed to update vision config');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchModel = async () => {
    if (!selectedVisionModel) return;
    const modelDoc = visionModels.find((m) => m.model_id === selectedVisionModel);
    if (!modelDoc) return;

    try {
      setSaving(true);
      await llmConfigService.updateConfig(component, {
        provider: modelDoc.provider,
        model: modelDoc.model_id,
      });
      toast.success(`Default model switched to ${modelDoc.display_name || modelDoc.model_id}`);
      setSelectedVisionModel('');
      onReload();
    } catch (err) {
      toast.error(err.message || 'Failed to switch model');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <VisibilityIcon sx={{ color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Vision Tools
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={visionEnabled}
              onChange={(e) => handleToggle(e.target.checked)}
              disabled={saving}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Enable vision tools
              </Typography>
              <Typography variant="caption" color="text.secondary">
                When enabled, Peil can visually inspect video frames during sessions.
                The default model must support vision — images are returned as tool results
                within the same conversation.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', ml: 0, mb: 2 }}
        />

        {saving && <CircularProgress size={20} sx={{ ml: 2 }} />}

        {visionEnabled && (
          <>
            {modelHasVision ? (
              <Alert severity="success" sx={{ mt: 1 }}>
                The current default model ({currentModelDoc?.display_name || currentModel}) supports vision.
                No model change needed.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  The current default model ({currentModel || 'none selected'}) does not have the
                  "vision" capability. Vision tool results contain images that the model must
                  be able to interpret. Switch to a vision-capable model below.
                </Typography>
                {visionModels.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                    <FormControl size="small" sx={{ minWidth: 280 }}>
                      <InputLabel>Switch default model to</InputLabel>
                      <Select
                        value={selectedVisionModel}
                        label="Switch default model to"
                        onChange={(e) => setSelectedVisionModel(e.target.value)}
                      >
                        {visionModels.map((m) => (
                          <MenuItem key={m.model_id} value={m.model_id}>
                            {m.display_name || m.model_id} ({m.provider})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSwitchModel}
                      disabled={!selectedVisionModel || saving}
                    >
                      Switch
                    </Button>
                  </Box>
                )}
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VisionToolsConfig;
