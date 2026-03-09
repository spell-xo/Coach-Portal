import React, { useState, useEffect, useCallback } from 'react';
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
  TextField,
  MenuItem,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import { selectIsPlatformEngineering } from '../../store/authSlice';
import tokenUsageService from '../../api/tokenUsageService';
import UsageSummaryCards from '../../components/usage-tracking/UsageSummaryCards';
import UsageTimelineChart from '../../components/usage-tracking/UsageTimelineChart';
import UsageByUserTab from '../../components/usage-tracking/UsageByUserTab';
import UsageByToolTab from '../../components/usage-tracking/UsageByToolTab';
import UsageErrorsTab from '../../components/usage-tracking/UsageErrorsTab';

const COMPONENTS = [
  { value: '', label: 'All Components' },
  { value: 'wizard', label: 'Wizard' },
  { value: 'chat', label: 'Chat' },
  { value: 'cohort_wizard', label: 'Cohort Wizard' },
  { value: 'report_wizard', label: 'Report Wizard' },
];

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const getDefaultDateFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};

const getDefaultDateTo = () => {
  return new Date().toISOString().split('T')[0];
};

const PeilUsageTracking = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDateTo);
  const [period, setPeriod] = useState('daily');
  const [component, setComponent] = useState('');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);

  // Data
  const [summary, setSummary] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [toolData, setToolData] = useState([]);
  const [errorData, setErrorData] = useState(null);

  const buildParams = useCallback(() => {
    const params = {};
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (period) params.period = period;
    if (component) params.component = component;
    if (model) params.model_id = model;
    return params;
  }, [dateFrom, dateTo, period, component, model]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = buildParams();

      const [summaryRes, userRes, toolRes, errorsRes] = await Promise.all([
        tokenUsageService.getSummary(params),
        tokenUsageService.getByUser(params),
        tokenUsageService.getByTool(params),
        tokenUsageService.getErrors(params),
      ]);

      // Backend returns: { period, data: [...], totals: {...} }
      setSummary(summaryRes.totals || {});
      setTimelineData(summaryRes.data || []);
      setUserData(userRes.data || []);
      setToolData(toolRes.data || []);
      setErrorData(errorsRes || null);

      // Extract unique models from summary for the filter dropdown
      if (summaryRes.available_models) {
        setAvailableModels(summaryRes.available_models);
      }
    } catch (err) {
      console.error('Error loading usage data:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    if (isPlatformEngineering) {
      loadData();
    }
  }, [isPlatformEngineering, loadData]);

  if (!isPlatformEngineering) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Peil Usage Tracking
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor token usage, costs, and API activity across Peil components
            </Typography>
          </Box>
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            select
            label="Period"
            size="small"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{ width: 130 }}
          >
            {PERIODS.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Component"
            size="small"
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            sx={{ width: 170 }}
          >
            {COMPONENTS.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Model"
            size="small"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            sx={{ width: 200 }}
          >
            <MenuItem value="">All Models</MenuItem>
            {availableModels.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>
        </Paper>

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
            <UsageSummaryCards summary={summary} />

            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Timeline" />
                <Tab label="By User" />
                <Tab label="By Tool" />
                <Tab label={`Errors${errorData?.totals?.total_errors ? ` (${errorData.totals.total_errors})` : ''}`} />
              </Tabs>
            </Paper>

            {activeTab === 0 && <UsageTimelineChart data={timelineData} />}
            {activeTab === 1 && <UsageByUserTab data={userData} />}
            {activeTab === 2 && <UsageByToolTab data={toolData} />}
            {activeTab === 3 && (
              <UsageErrorsTab
                data={errorData?.data || []}
                recentErrors={errorData?.recent_errors || []}
                totals={errorData?.totals || {}}
              />
            )}
          </>
        )}
      </Container>
    </AppLayout>
  );
};

export default PeilUsageTracking;
