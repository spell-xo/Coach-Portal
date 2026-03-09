import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import toast from 'react-hot-toast';
import sandboxService from '../../api/sandboxService';
import DiffViewerModal from '../wizard/DiffViewerModal';
import ScoreDeltaDisplay from './ScoreDeltaDisplay';

const PatchTester = ({ drillId, gameType, scores, drill }) => {
  // Patch selection
  const [patches, setPatches] = useState([]);
  const [selectedPatchId, setSelectedPatchId] = useState('');
  const [selectedPatch, setSelectedPatch] = useState(null);
  const [loadingPatches, setLoadingPatches] = useState(false);

  // Diff viewer
  const [diffModalOpen, setDiffModalOpen] = useState(false);

  // Test execution
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [versionWarning, setVersionWarning] = useState(null);

  // Run history (Phase 4C)
  const [runHistory, setRunHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Batch testing
  const [availableDrills, setAvailableDrills] = useState([]);
  const [selectedBatchDrills, setSelectedBatchDrills] = useState([]);
  const [loadingDrills, setLoadingDrills] = useState(false);
  const [runningBatch, setRunningBatch] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  // Approval
  const [approving, setApproving] = useState(false);

  // Load patches on mount
  useEffect(() => {
    loadPatches();
  }, [gameType]);

  const loadPatches = useCallback(async () => {
    setLoadingPatches(true);
    try {
      const response = await sandboxService.listPatches({
        drill_type: gameType,
        status: 'draft,testing,validated',
      });
      setPatches(response.patches || []);
    } catch (err) {
      console.error('Failed to load patches:', err);
      toast.error('Failed to load patches');
    } finally {
      setLoadingPatches(false);
    }
  }, [gameType]);

  // Load patch details when selected
  useEffect(() => {
    if (selectedPatchId) {
      loadPatchDetails(selectedPatchId);
      loadRunHistory(selectedPatchId);
    } else {
      setSelectedPatch(null);
      setTestResult(null);
      setRunHistory([]);
    }
  }, [selectedPatchId]);

  const loadPatchDetails = async (patchId) => {
    try {
      const response = await sandboxService.getPatch(patchId);
      setSelectedPatch(response.patch || null);
    } catch (err) {
      console.error('Failed to load patch details:', err);
    }
  };

  // Phase 4C: Run history
  const loadRunHistory = async (patchId) => {
    setLoadingHistory(true);
    try {
      const response = await sandboxService.listRuns({ patch_id: patchId });
      setRunHistory(response.runs || []);
    } catch (err) {
      console.error('Failed to load run history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Run single drill test
  const handleRunTest = async () => {
    if (!selectedPatchId || !drillId) return;
    setRunning(true);
    setTestResult(null);
    setVersionWarning(null);
    try {
      const response = await sandboxService.runTest(selectedPatchId, [drillId], gameType);
      setTestResult(response.data || response);
      if (response.version_warning) {
        setVersionWarning(response.version_warning);
      }
      toast.success(`Test completed: ${response.data?.status || 'done'}`);
      // Refresh run history
      loadRunHistory(selectedPatchId);
    } catch (err) {
      console.error('Sandbox test failed:', err);
      toast.error(err.message || 'Sandbox test failed');
    } finally {
      setRunning(false);
    }
  };

  // Batch testing
  const loadAvailableDrills = async () => {
    if (!gameType) return;
    setLoadingDrills(true);
    try {
      const response = await sandboxService.listDrills(gameType, 20);
      // Filter out current drill
      const drills = (response.drills || []).filter(d => d.drill_id !== drillId);
      setAvailableDrills(drills);
    } catch (err) {
      console.error('Failed to load drills:', err);
      toast.error('Failed to load drills for batch testing');
    } finally {
      setLoadingDrills(false);
    }
  };

  useEffect(() => {
    if (selectedPatchId && gameType) {
      loadAvailableDrills();
    }
  }, [selectedPatchId, gameType]);

  const handleRunBatch = async () => {
    if (!selectedPatchId || selectedBatchDrills.length === 0) return;
    setRunningBatch(true);
    setBatchResult(null);
    try {
      const response = await sandboxService.runTest(
        selectedPatchId,
        selectedBatchDrills,
        gameType
      );
      setBatchResult(response.data || response);
      toast.success(`Batch test completed: ${selectedBatchDrills.length} drills tested`);
      loadRunHistory(selectedPatchId);
    } catch (err) {
      console.error('Batch test failed:', err);
      toast.error(err.message || 'Batch test failed');
    } finally {
      setRunningBatch(false);
    }
  };

  // Phase 4D: Approval
  const handleApprove = async () => {
    if (!selectedPatchId) return;
    setApproving(true);
    try {
      await sandboxService.proposeForIntegration(selectedPatchId);
      // Also update patch status to validated
      await sandboxService.updatePatchStatus(selectedPatchId, 'validated');
      toast.success(`Patch ${selectedPatchId} approved and proposed for integration`);
      loadPatches();
      loadPatchDetails(selectedPatchId);
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error(err.message || 'Failed to approve patch');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPatchId) return;
    try {
      await sandboxService.updatePatchStatus(selectedPatchId, 'rejected');
      toast.success(`Patch ${selectedPatchId} rejected`);
      loadPatches();
      setSelectedPatchId('');
    } catch (err) {
      toast.error(err.message || 'Failed to reject patch');
    }
  };

  // Phase 4B: Check for regressions
  const getRegressionAlerts = (result) => {
    if (!result?.summary) return [];
    const alerts = [];
    // Check from run drills data
    const drills = result.drills || [];
    drills.forEach(d => {
      if (d.delta != null && d.delta < -5) {
        alerts.push({
          drill_id: d.drill_id,
          delta: d.delta,
          game_type: d.game_type,
        });
      }
    });
    return alerts;
  };

  const testRegressions = getRegressionAlerts(testResult);
  const batchRegressions = getRegressionAlerts(batchResult);

  return (
    <Box>
      {/* Patch Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Patch
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Code Patch</InputLabel>
          <Select
            value={selectedPatchId}
            onChange={(e) => setSelectedPatchId(e.target.value)}
            label="Code Patch"
            disabled={loadingPatches}
          >
            <MenuItem value="">
              <em>Select a patch...</em>
            </MenuItem>
            {patches.map((p) => (
              <MenuItem key={p.patch_id} value={p.patch_id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {p.patch_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }} noWrap>
                    {p.description}
                  </Typography>
                  <Chip
                    label={p.status}
                    size="small"
                    color={
                      p.status === 'validated' ? 'success' :
                      p.status === 'testing' ? 'info' :
                      p.status === 'rejected' ? 'error' : 'default'
                    }
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                  {p.source === 'claude_code' && (
                    <Chip label="CC" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                  )}
                  {p.test_run_count > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {p.test_run_count} run{p.test_run_count !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {loadingPatches && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>

      {/* Patch Info */}
      {selectedPatch && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6">
                {selectedPatch.patch_id}
                <Chip
                  label={selectedPatch.status}
                  size="small"
                  sx={{ ml: 1 }}
                  color={
                    selectedPatch.status === 'validated' ? 'success' :
                    selectedPatch.status === 'testing' ? 'info' :
                    selectedPatch.status === 'rejected' ? 'error' : 'default'
                  }
                />
                {selectedPatch.source === 'claude_code' && (
                  <Chip label="Claude Code" size="small" variant="outlined" color="secondary" sx={{ ml: 1 }} />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedPatch.description}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CodeIcon />}
              onClick={() => setDiffModalOpen(true)}
            >
              View Diff
            </Button>
          </Box>
          {selectedPatch.files_modified?.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {selectedPatch.files_modified.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}
                />
              ))}
            </Box>
          )}
          {selectedPatch.tested_locally && (
            <Alert severity="info" sx={{ mt: 2 }} icon={<CheckCircleIcon fontSize="small" />}>
              Tested locally before registration
              {selectedPatch.test_results?.notes && ` — ${selectedPatch.test_results.notes}`}
            </Alert>
          )}
        </Paper>
      )}

      {/* Run Test Button */}
      {selectedPatch && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={running ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleRunTest}
              disabled={running || !drillId}
              color="primary"
            >
              {running ? 'Running Patched Analysis...' : 'Run Patched Analysis'}
            </Button>
            <Typography variant="body2" color="text.secondary">
              Test {selectedPatch.patch_id} against this drill
            </Typography>
          </Box>

          {/* Version warning */}
          {versionWarning && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {versionWarning}
            </Alert>
          )}

          {/* Phase 4B: Regression alerts */}
          {testRegressions.length > 0 && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                Regression detected!
              </Typography>
              {testRegressions.map((r) => (
                <Typography key={r.drill_id} variant="body2">
                  Drill {r.drill_id}: {r.delta.toFixed(1)} points
                </Typography>
              ))}
            </Alert>
          )}

          {/* Test Results — Comparison View */}
          {testResult && testResult.summary && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Results
              </Typography>
              <Grid container spacing={2}>
                {(testResult.drills || []).map((drillResult, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: drillResult.delta >= 0 ? 'success.main' : 'error.main' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {drillResult.game_type?.replace(/_/g, ' ') || 'Drill'}
                        </Typography>
                        <Chip
                          label={drillResult.error ? 'Error' : drillResult.delta >= 0 ? 'Improved' : 'Regressed'}
                          size="small"
                          color={drillResult.error ? 'error' : drillResult.delta >= 0 ? 'success' : 'error'}
                        />
                      </Box>
                      {drillResult.error ? (
                        <Alert severity="error" sx={{ mt: 1 }}>{drillResult.error}</Alert>
                      ) : (
                        <>
                          <ScoreDeltaDisplay
                            label="Total"
                            original={drillResult.original_score}
                            patched={drillResult.test_score}
                            delta={drillResult.delta}
                          />
                          {drillResult.area_deltas && Object.entries(drillResult.area_deltas).map(([area, d]) => (
                            <ScoreDeltaDisplay
                              key={area}
                              label={area}
                              original={drillResult.original_areas?.[area]}
                              patched={drillResult.test_areas?.[area]}
                              delta={d}
                            />
                          ))}
                          <ScoreDeltaDisplay
                            label="Activities"
                            original={drillResult.original_activities}
                            patched={drillResult.test_activities}
                          />
                        </>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Summary */}
              {testResult.summary && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Avg Delta</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: testResult.summary.avg_score_delta >= 0 ? 'success.main' : 'error.main' }}>
                        {testResult.summary.avg_score_delta?.toFixed(1)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Improved</Typography>
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        {testResult.summary.drills_improved || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Regressed</Typography>
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        {testResult.summary.drills_regressed || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Batch Validation */}
      {selectedPatch && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Batch Validation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Test this patch against multiple drills of the same type
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Select Drills</InputLabel>
            <Select
              multiple
              value={selectedBatchDrills}
              onChange={(e) => setSelectedBatchDrills(e.target.value)}
              input={<OutlinedInput label="Select Drills" />}
              renderValue={(selected) => `${selected.length} drill${selected.length !== 1 ? 's' : ''} selected`}
              disabled={loadingDrills}
            >
              {availableDrills.map((d) => (
                <MenuItem key={d.drill_id} value={d.drill_id}>
                  <Checkbox checked={selectedBatchDrills.includes(d.drill_id)} />
                  <ListItemText
                    primary={`${d.player_name} — ${d.total_score?.toFixed(1) || 'N/A'}pts`}
                    secondary={d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}
                  />
                  {d.has_csv && <Chip label="CSV" size="small" sx={{ height: 18, fontSize: '0.6rem' }} />}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={runningBatch ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={handleRunBatch}
            disabled={runningBatch || selectedBatchDrills.length === 0}
          >
            {runningBatch ? 'Running Batch...' : `Run on ${selectedBatchDrills.length} Drill${selectedBatchDrills.length !== 1 ? 's' : ''}`}
          </Button>

          {/* Batch regression alerts */}
          {batchRegressions.length > 0 && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {batchRegressions.length} drill{batchRegressions.length !== 1 ? 's' : ''} regressed by &gt;5 points
              </Typography>
              {batchRegressions.map((r) => (
                <Typography key={r.drill_id} variant="caption" display="block">
                  {r.drill_id}: {r.delta.toFixed(1)} points
                </Typography>
              ))}
            </Alert>
          )}

          {/* Batch Results */}
          {batchResult && batchResult.summary && (
            <Box sx={{ mt: 2 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>Batch Summary</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Tested</Typography>
                    <Typography variant="body2" fontWeight={600}>{batchResult.summary.drills_tested}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Avg Delta</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: batchResult.summary.avg_score_delta >= 0 ? 'success.main' : 'error.main' }}>
                      {batchResult.summary.avg_score_delta?.toFixed(1)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Improved</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">{batchResult.summary.drills_improved || 0}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Regressed</Typography>
                    <Typography variant="body2" fontWeight={600} color="error.main">{batchResult.summary.drills_regressed || 0}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </Paper>
      )}

      {/* Run History (Phase 4C) */}
      {selectedPatch && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HistoryIcon fontSize="small" />
            <Typography variant="h6">Run History</Typography>
          </Box>
          {loadingHistory ? (
            <CircularProgress size={24} />
          ) : runHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No previous test runs for this patch
            </Typography>
          ) : (
            runHistory.map((run) => (
              <Paper key={run.run_id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{run.run_id}</Typography>
                    <Chip
                      label={run.status}
                      size="small"
                      color={
                        run.status === 'completed' ? 'success' :
                        run.status === 'failed' ? 'error' :
                        run.status === 'running' ? 'info' : 'default'
                      }
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                    <Chip
                      label={run.run_type || 'test'}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {run.created_at ? new Date(run.created_at).toLocaleString() : ''}
                  </Typography>
                </Box>
                {run.summary && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="caption">
                      {run.summary.drills_tested} tested
                    </Typography>
                    <Typography variant="caption" sx={{ color: run.summary.avg_score_delta >= 0 ? 'success.main' : 'error.main' }}>
                      Avg: {run.summary.avg_score_delta?.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {run.summary.drills_improved || 0} improved
                    </Typography>
                    <Typography variant="caption" color="error.main">
                      {run.summary.drills_regressed || 0} regressed
                    </Typography>
                  </Box>
                )}
                {run.version_match === false && (
                  <Typography variant="caption" color="warning.main">Version mismatch</Typography>
                )}
              </Paper>
            ))
          )}
        </Paper>
      )}

      {/* Approve / Reject Controls (Phase 4D) */}
      {selectedPatch && selectedPatch.status !== 'rejected' && selectedPatch.status !== 'applied' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Review Decision
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={approving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
              onClick={handleApprove}
              disabled={approving || !runHistory.some(r => r.status === 'completed')}
            >
              {approving ? 'Approving...' : 'Approve Fix'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleReject}
            >
              Reject
            </Button>
          </Box>
          {!runHistory.some(r => r.status === 'completed') && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Run at least one successful test before approving
            </Typography>
          )}
        </Paper>
      )}

      {/* Diff Viewer Modal */}
      <DiffViewerModal
        open={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        patch={selectedPatch}
      />
    </Box>
  );
};

export default PatchTester;
