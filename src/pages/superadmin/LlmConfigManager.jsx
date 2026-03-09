import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import llmConfigService from '../../api/llmConfigService';
import { selectIsPlatformEngineering } from '../../store/authSlice';
import ComponentConfigTab from '../../components/llm-config/ComponentConfigTab';
import ModelCatalog from '../../components/llm-config/ModelCatalog';

const COMPONENTS = [
  { value: 'wizard', label: 'Wizard Chat' },
  { value: 'askdev', label: 'AskDev' },
  { value: 'code_editor', label: 'Code Editor' },
  { value: 'devil_advocate', label: "Devil's Advocate" },
  { value: 'investigation', label: 'Investigation' },
  { value: 'quick_fix_patch', label: 'Quick Fix Patch' },
  { value: 'ai_coach_chat', label: 'AI Coach Chat' },
];

const PROVIDERS = [
  { value: 'vertex_ai', label: 'Vertex AI (Gemini)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI' },
];

const TIERS = [
  { value: 'platform_engineering', label: 'Platform Engineering' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'support_agent', label: 'Support Agent' },
];

const LlmConfigManager = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [configs, setConfigs] = useState({});
  const [providerStatus, setProviderStatus] = useState({});
  const [allModels, setAllModels] = useState([]);

  const activeComponent = COMPONENTS[activeTab]?.value;

  // Group models by provider for dropdowns
  const modelsByProvider = useMemo(() => {
    const grouped = {};
    allModels.forEach((m) => {
      const provider = m.provider;
      if (!grouped[provider]) grouped[provider] = [];
      grouped[provider].push(m);
    });
    return grouped;
  }, [allModels]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [configsRes, statusRes, modelsRes] = await Promise.all([
        llmConfigService.getConfigs(),
        llmConfigService.getProviderStatus(),
        llmConfigService.getModels(),
      ]);

      // Transform flat configs list into component-grouped format
      const configsList = (configsRes.data || configsRes)?.configs || [];
      const grouped = {};
      configsList.forEach((c) => {
        const comp = c.component;
        if (!grouped[comp]) grouped[comp] = { default: null, overrides: {}, tools: [] };
        if (c.tool) {
          // Tool-level override
          grouped[comp].tools.push(c);
        } else if (c.tier === 'default') {
          grouped[comp].default = c;
        } else {
          grouped[comp].overrides[c.tier] = c;
        }
      });
      setConfigs(grouped);

      setProviderStatus(statusRes.data || statusRes);
      setAllModels(modelsRes.data?.models || modelsRes.models || modelsRes.data || []);
    } catch (err) {
      console.error('Error loading LLM configs:', err);
      setError('Failed to load LLM configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPlatformEngineering) {
      loadData();
    }
  }, [isPlatformEngineering, loadData]);

  if (!isPlatformEngineering) {
    return <Navigate to="/dashboard" replace />;
  }

  const compConfig = configs?.[activeComponent];

  // Check for deprecation warnings on the active component's models
  const warnings = [];
  if (compConfig?.default) {
    const model = allModels.find((m) => m.model_id === compConfig.default.model);
    if (model?.status === 'deprecated') {
      warnings.push(`Default model "${model.model_id}" is deprecated${model.successor_model_id ? `. Suggested successor: ${model.successor_model_id}` : ''}.`);
    }
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              LLM Configuration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure LLM providers and models for each DAW component
            </Typography>
          </Box>
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Component Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {COMPONENTS.map((comp) => (
                  <Tab key={comp.value} label={comp.label} />
                ))}
              </Tabs>
            </Paper>

            {/* Active Component Config */}
            <ComponentConfigTab
              component={activeComponent}
              config={compConfig}
              toolConfigs={compConfig?.tools || []}
              modelsByProvider={modelsByProvider}
              allModels={allModels}
              providers={PROVIDERS}
              tiers={TIERS}
              providerStatus={providerStatus}
              warnings={warnings}
              onReload={loadData}
            />

            {/* Model Catalog */}
            <Divider sx={{ my: 4 }} />
            <ModelCatalog />
          </>
        )}
      </Container>
    </AppLayout>
  );
};

export default LlmConfigManager;
