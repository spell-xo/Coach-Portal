import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
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
  Collapse,
  Divider,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DifferenceIcon from '@mui/icons-material/Difference';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UndoIcon from '@mui/icons-material/Undo';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import DiffViewerModal from '../../components/wizard/DiffViewerModal';
import sandboxService from '../../api/sandboxService';
import { selectIsPlatformEngineering } from '../../store/authSlice';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'testing', label: 'Testing' },
  { value: 'validated', label: 'Validated' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'applied', label: 'Applied' },
  { value: 'rejected', label: 'Rejected' },
];

const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    testing: 'info',
    validated: 'success',
    proposed: 'warning',
    applied: 'success',
    rejected: 'error',
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

const PatchChainManager = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patches, setPatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [drillTypeFilter, setDrillTypeFilter] = useState('');
  const [expandedChain, setExpandedChain] = useState(null);
  const [diffPatch, setDiffPatch] = useState(null);

  const loadPatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await sandboxService.listPatches({
        status: statusFilter || undefined,
        drill_type: drillTypeFilter || undefined,
        limit: 200,
      });
      setPatches(res.data || res.patches || []);
    } catch (err) {
      console.error('Error loading patches:', err);
      setError('Failed to load patches');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, drillTypeFilter]);

  useEffect(() => {
    if (isPlatformEngineering) {
      loadPatches();
    }
  }, [isPlatformEngineering, loadPatches]);

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
  Object.values(patchChains).forEach((chain) => chain.sort((a, b) => (a.version || 1) - (b.version || 1)));

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/superadmin/sandbox')}
            sx={{ mb: 1 }}
          >
            Back to Sandbox
          </Button>
        </Box>

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Patch Chain Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Browse and manage all code patch chains
            </Typography>
          </Box>
          <IconButton onClick={loadPatches} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                {Object.keys(patchChains).length} chain{Object.keys(patchChains).length !== 1 ? 's' : ''}, {patches.length} patch{patches.length !== 1 ? 'es' : ''}
              </Typography>
            </Grid>
          </Grid>
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
        ) : Object.keys(patchChains).length === 0 ? (
          <Alert severity="info">No patch chains found.</Alert>
        ) : (
          Object.entries(patchChains).map(([chainId, chainPatches]) => {
            const latest = chainPatches[chainPatches.length - 1];
            const isExpanded = expandedChain === chainId;
            return (
              <Card key={chainId} variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ pb: isExpanded ? 2 : '12px !important' }}>
                  {/* Chain Header */}
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setExpandedChain(isExpanded ? null : chainId)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {chainId}
                      </Typography>
                      <Chip label={latest.status || 'draft'} size="small" color={getStatusColor(latest.status)} />
                      {latest.drill_type && (
                        <Chip label={latest.drill_type.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Version timeline */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {chainPatches.map((p, idx) => (
                          <React.Fragment key={p.patch_id}>
                            {idx > 0 && (
                              <Typography variant="caption" color="text.disabled">&rarr;</Typography>
                            )}
                            <Chip
                              label={`v${p.version || idx + 1}`}
                              size="small"
                              color={getStatusColor(p.status)}
                              variant={p === latest ? 'filled' : 'outlined'}
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          </React.Fragment>
                        ))}
                      </Box>
                      <IconButton
                        size="small"
                        sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                      >
                        <ExpandMoreIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {latest.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {latest.description}
                    </Typography>
                  )}

                  {/* Expanded: All versions */}
                  <Collapse in={isExpanded}>
                    <Divider sx={{ my: 2 }} />
                    {chainPatches.map((patch) => (
                      <Paper key={patch.patch_id} variant="outlined" sx={{ p: 2, mb: 1.5, bgcolor: 'grey.50' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                              {patch.patch_id} (v{patch.version || 1})
                            </Typography>
                            <Chip label={patch.status || 'draft'} size="small" color={getStatusColor(patch.status)} sx={{ height: 20, fontSize: '0.65rem' }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(patch.created_at)}
                          </Typography>
                        </Box>
                        {patch.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {patch.description}
                          </Typography>
                        )}
                        {patch.files_modified?.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                            {patch.files_modified.map((f) => (
                              <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                            ))}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View diff">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DifferenceIcon sx={{ fontSize: 14 }} />}
                              onClick={() => setDiffPatch(patch)}
                              sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                            >
                              Diff
                            </Button>
                          </Tooltip>
                          {patch.test_runs?.length > 0 && (
                            <Tooltip title="View sandbox runs">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                                onClick={() => navigate(`/superadmin/sandbox/${patch.test_runs[0]}`)}
                                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                              >
                                Runs ({patch.test_runs.length})
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Collapse>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Diff Viewer Modal */}
        <DiffViewerModal
          open={Boolean(diffPatch)}
          onClose={() => setDiffPatch(null)}
          patch={diffPatch}
        />
      </Container>
    </AppLayout>
  );
};

export default PatchChainManager;
