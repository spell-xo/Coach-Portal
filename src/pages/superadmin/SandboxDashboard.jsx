import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import sandboxService from '../../api/sandboxService';
import { selectIsPlatformEngineering } from '../../store/authSlice';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'testing', label: 'Testing' },
  { value: 'validated', label: 'Validated' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'applied', label: 'Applied' },
  { value: 'rejected', label: 'Rejected' },
];

const RUN_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'partial', label: 'Partial' },
];

const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    testing: 'info',
    validated: 'success',
    proposed: 'warning',
    applied: 'success',
    rejected: 'error',
    queued: 'default',
    running: 'info',
    completed: 'success',
    failed: 'error',
    partial: 'warning',
  };
  return colors[status] || 'default';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDelta = (delta) => {
  if (delta == null) return '-';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}`;
};

const SandboxDashboard = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runs, setRuns] = useState([]);
  const [patches, setPatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [runStatusFilter, setRunStatusFilter] = useState('');
  const [drillTypeFilter, setDrillTypeFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [runsRes, patchesRes] = await Promise.all([
        sandboxService.listRuns({ status: runStatusFilter || undefined, drill_type: drillTypeFilter || undefined, limit: 50 }),
        sandboxService.listPatches({ status: statusFilter || undefined, limit: 50 }),
      ]);
      setRuns(runsRes.data || runsRes.runs || []);
      setPatches(patchesRes.data || patchesRes.patches || []);
    } catch (err) {
      console.error('Error loading sandbox data:', err);
      setError('Failed to load sandbox data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, runStatusFilter, drillTypeFilter]);

  useEffect(() => {
    if (isPlatformEngineering) {
      loadData();
    }
  }, [isPlatformEngineering, loadData]);

  const handlePropose = async (patchId) => {
    try {
      await sandboxService.proposeForIntegration(patchId);
      toast.success('Patch proposed for integration');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to propose patch');
    }
  };

  if (!isPlatformEngineering) {
    return <Navigate to="/dashboard" replace />;
  }

  // Group patches by chain_id
  const patchChains = {};
  patches.forEach((patch) => {
    const chainId = patch.chain_id || patch.patch_id;
    if (!patchChains[chainId]) {
      patchChains[chainId] = [];
    }
    patchChains[chainId].push(patch);
  });
  // Sort each chain by version
  Object.values(patchChains).forEach((chain) => chain.sort((a, b) => (a.version || 1) - (b.version || 1)));

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Sandbox Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View sandbox test runs, code patches, and validation results
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/superadmin/sandbox/patches')}
            >
              Patch Manager
            </Button>
            <IconButton onClick={loadData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
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
            {/* Patch Chains Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Patch Chains
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Patch Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Patch Status"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {Object.keys(patchChains).length === 0 ? (
                <Alert severity="info">No patch chains found.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {Object.entries(patchChains).map(([chainId, chainPatches]) => {
                    const latest = chainPatches[chainPatches.length - 1];
                    return (
                      <Grid item xs={12} sm={6} md={4} key={chainId}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                {chainId}
                              </Typography>
                              <Chip
                                label={latest.status || 'draft'}
                                size="small"
                                color={getStatusColor(latest.status)}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              {latest.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                              {chainPatches.map((p) => (
                                <Chip
                                  key={p.patch_id}
                                  label={`v${p.version || 1}`}
                                  size="small"
                                  variant={p === latest ? 'filled' : 'outlined'}
                                  color={getStatusColor(p.status)}
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              ))}
                            </Box>
                            {latest.files_modified?.length > 0 && (
                              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: '0.65rem' }}>
                                {latest.files_modified.join(', ')}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Paper>

            {/* Recent Runs Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 3 }}>
              Recent Runs
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Run Status</InputLabel>
                    <Select
                      value={runStatusFilter}
                      onChange={(e) => setRunStatusFilter(e.target.value)}
                      label="Run Status"
                    >
                      {RUN_STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {runs.length === 0 ? (
                <Alert severity="info">No sandbox runs found.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Run ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Patch</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Drills</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Avg Delta</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {runs.map((run) => (
                        <TableRow
                          key={run.run_id || run._id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/superadmin/sandbox/${run.run_id || run._id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {run.run_id || run._id?.slice(-8)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {run.patch_id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={run.status}
                              size="small"
                              color={getStatusColor(run.status)}
                            />
                          </TableCell>
                          <TableCell>{run.summary?.drills_tested || run.drills?.length || '-'}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: (run.summary?.avg_score_delta || 0) > 0 ? 'success.main' :
                                       (run.summary?.avg_score_delta || 0) < 0 ? 'error.main' : 'text.secondary',
                              }}
                            >
                              {formatDelta(run.summary?.avg_score_delta)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={run.type || 'test'}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell>{formatDate(run.created_at)}</TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              <Tooltip title="View results">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/superadmin/sandbox/${run.run_id || run._id}`)}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {run.status === 'completed' && (
                                <Tooltip title="Propose for integration">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handlePropose(run.patch_id)}
                                  >
                                    <SendIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}
      </Container>
    </AppLayout>
  );
};

export default SandboxDashboard;
