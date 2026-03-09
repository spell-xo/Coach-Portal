import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  Tooltip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import BuildIcon from '@mui/icons-material/Build';
import reprocessService from '../../api/reprocessService';

const getScoreColor = (score) => {
  if (score === null || score === undefined) return 'default';
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
};

const DeltaDisplay = ({ value }) => {
  if (value === null || value === undefined) return <span>-</span>;
  const rounded = Math.round(value * 10) / 10;
  if (rounded > 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
        <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
        +{rounded}
      </Box>
    );
  }
  if (rounded < 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
        <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
        {rounded}
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
      <RemoveIcon fontSize="small" sx={{ mr: 0.5 }} />
      0
    </Box>
  );
};

const ReprocessPanel = ({ drillId, videoId, drill, scores, onApplied }) => {
  const [reprocessing, setReprocessing] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  const [applying, setApplying] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [patchId, setPatchId] = useState('');
  const [history, setHistory] = useState(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [availablePatches, setAvailablePatches] = useState(null);
  const [patchesLoading, setPatchesLoading] = useState(false);

  // Check for existing pending result on mount
  const checkPending = useCallback(async () => {
    if (!videoId) return;
    try {
      const response = await reprocessService.getPreview(videoId);
      if (response && response.data) {
        setPendingResult(response.data);
      }
    } catch {
      // No pending result — that's fine
    }
  }, [videoId]);

  useEffect(() => {
    checkPending();
  }, [checkPending]);

  const loadPatches = useCallback(async () => {
    setPatchesLoading(true);
    try {
      const gameType = drill?.gameType || null;
      const response = await reprocessService.listPatches(gameType);
      setAvailablePatches(response.patches || []);
    } catch {
      setAvailablePatches([]);
    } finally {
      setPatchesLoading(false);
    }
  }, [drill?.gameType]);

  const handleTriggerReprocess = async () => {
    setConfirmDialogOpen(false);
    setReprocessing(true);
    setError('');

    try {
      const trimmedPatch = patchId.trim() || null;
      const response = await reprocessService.triggerReprocess(videoId, reason, trimmedPatch);
      if (response.data) {
        setPendingResult(response.data);
      }
    } catch (err) {
      setError(err.message || 'Reprocessing failed');
    } finally {
      setReprocessing(false);
      setReason('');
      setPatchId('');
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setError('');

    try {
      await reprocessService.applyResult(videoId);
      setPendingResult(null);
      if (onApplied) onApplied();
    } catch (err) {
      setError(err.message || 'Failed to apply result');
    } finally {
      setApplying(false);
    }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    setError('');

    try {
      await reprocessService.discardResult(videoId);
      setPendingResult(null);
    } catch (err) {
      setError(err.message || 'Failed to discard result');
    } finally {
      setDiscarding(false);
    }
  };

  const loadHistory = async () => {
    if (!videoId) return;
    try {
      const response = await reprocessService.getHistory(videoId);
      setHistory(response.data || []);
    } catch {
      setHistory([]);
    }
  };

  const handleHistoryToggle = (_, expanded) => {
    setHistoryExpanded(expanded);
    if (expanded && history === null) {
      loadHistory();
    }
  };

  if (!videoId) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">No video ID available for reprocessing.</Typography>
      </Paper>
    );
  }

  // Build comparison rows from pending result
  const comparisonRows = [];
  if (pendingResult) {
    const original = pendingResult.original_scores || {};
    const reprocessed = pendingResult.reprocessed_scores || {};
    const comparison = pendingResult.comparison || {};

    // Total score row
    comparisonRows.push({
      metric: 'Total Score',
      original: original.total_score,
      reprocessed: reprocessed.total_score,
      delta: comparison.total_score_delta,
    });

    // Area score rows
    const originalAreas = original.areas || {};
    const reprocessedAreas = reprocessed.areas || {};
    const areaDeltas = comparison.areas_delta || {};
    const allAreaKeys = [...new Set([...Object.keys(originalAreas), ...Object.keys(reprocessedAreas)])];

    allAreaKeys.sort().forEach((key) => {
      const origVal = originalAreas[key];
      let reprVal = reprocessedAreas[key];
      if (reprVal && typeof reprVal === 'object') {
        reprVal = reprVal.areaScore ?? reprVal.score;
      }
      comparisonRows.push({
        metric: key,
        original: typeof origVal === 'object' ? origVal : origVal,
        reprocessed: reprVal,
        delta: areaDeltas[key],
      });
    });

    // Activity count row
    comparisonRows.push({
      metric: 'Activities',
      original: original.activity_count,
      reprocessed: reprocessed.activity_count,
      delta: comparison.activity_count_delta,
    });
  }

  const formatScore = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'number') return Math.round(val * 10) / 10;
    return val;
  };

  return (
    <Box>
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* A. Reprocess trigger */}
      {!pendingResult && !reprocessing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Drill Reprocessing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Re-run detection and scoring on existing CSV data. YOLO detection will be reused.
            Optionally apply a sandbox patch to preview the full effect before committing.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => { setPatchId(''); setConfirmDialogOpen(true); }}
              disabled={drill?.status !== 'PROCESSED'}
            >
              Reprocess with Latest Code
            </Button>
            <Button
              variant="outlined"
              startIcon={<BuildIcon />}
              onClick={() => { setConfirmDialogOpen(true); loadPatches(); }}
              disabled={drill?.status !== 'PROCESSED'}
            >
              Reprocess with Patch
            </Button>
          </Box>
          {drill?.status && drill.status !== 'PROCESSED' && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              Drill must have status PROCESSED to reprocess (current: {drill.status})
            </Typography>
          )}
        </Paper>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reprocess Drill</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {patchId
              ? 'Reprocess this drill with the selected patch applied to the analysis code.'
              : 'Reprocess this drill with the latest deployed analysis code.'
            }
            {' '}YOLO detection will be reused from the existing data.
          </Typography>

          {/* Patch picker */}
          {availablePatches !== null && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select a patch {drill?.gameType ? `(${drill.gameType.replace(/_/g, ' ')})` : ''}
              </Typography>
              {patchesLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">Loading patches...</Typography>
                </Box>
              ) : availablePatches.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  No patches available for this drill type.
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 280, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" />
                        <TableCell>Patch</TableCell>
                        <TableCell>Purpose</TableCell>
                        <TableCell>Investigation</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* "No patch" option */}
                      <TableRow
                        hover
                        selected={!patchId}
                        onClick={() => setPatchId('')}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Radio size="small" checked={!patchId} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        </TableCell>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" color="text.secondary">
                            Use latest deployed code (no patch)
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {availablePatches.map((patch) => (
                        <TableRow
                          key={patch.patch_id}
                          hover
                          selected={patchId === patch.patch_id}
                          onClick={() => setPatchId(patch.patch_id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Radio size="small" checked={patchId === patch.patch_id} />
                          </TableCell>
                          <TableCell>
                            <Chip label={patch.patch_id} size="small" color="warning" variant="outlined" />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Tooltip title={patch.description || ''} arrow>
                              <Typography variant="body2" noWrap>
                                {patch.description || '-'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {patch.engineering_request_id ? (
                              <Chip label={patch.engineering_request_id} size="small" variant="outlined" />
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={patch.status}
                              size="small"
                              color={
                                patch.status === 'approved' ? 'success' :
                                patch.status === 'tested' ? 'info' :
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {patch.created_at ? new Date(patch.created_at).toLocaleDateString() : '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Manual entry fallback */}
              <TextField
                fullWidth
                label="Or enter patch ID manually"
                value={patchId}
                onChange={(e) => setPatchId(e.target.value)}
                placeholder="e.g. CP-042"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          )}

          {/* If patches haven't loaded yet (e.g. "Reprocess with Latest Code" was clicked) */}
          {availablePatches === null && (
            <TextField
              fullWidth
              label="Patch ID (optional)"
              value={patchId}
              onChange={(e) => setPatchId(e.target.value)}
              placeholder="e.g. CP-042"
              size="small"
              sx={{ mb: 2 }}
              helperText="Leave empty to use latest deployed code, or enter a CP-### to apply a sandbox patch"
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Updated PRT weave detection logic"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTriggerReprocess} variant="contained">
            {patchId ? `Reprocess with ${patchId}` : 'Reprocess'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* B. Processing state */}
      {reprocessing && (
        <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Reprocessing drill...</Typography>
          <Typography variant="body2" color="text.secondary">
            This typically takes 2-10 seconds
          </Typography>
        </Paper>
      )}

      {/* C. Comparison view */}
      {pendingResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Alert severity={pendingResult.patch_id ? 'warning' : 'info'} sx={{ mb: 2 }}>
            {pendingResult.patch_id
              ? `Reprocessed with patch ${pendingResult.patch_id} — review and apply or discard`
              : 'Reprocessed with latest code — review and apply or discard'
            }
          </Alert>

          {/* Info chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={pendingResult.reprocess_id} size="small" variant="outlined" />
            {pendingResult.patch_id && (
              <Chip
                label={pendingResult.patch_id}
                size="small"
                color="warning"
                icon={<BuildIcon />}
              />
            )}
            <Chip
              label={`${pendingResult.processing_time_ms}ms`}
              size="small"
              variant="outlined"
            />
            {pendingResult.analysis_version && (
              <Chip
                label={`v${typeof pendingResult.analysis_version === 'string' ? pendingResult.analysis_version.slice(0, 8) : pendingResult.analysis_version}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Comparison table */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Metric</strong></TableCell>
                  <TableCell align="right"><strong>Original</strong></TableCell>
                  <TableCell align="right"><strong>Reprocessed</strong></TableCell>
                  <TableCell align="right"><strong>Delta</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.metric}>
                    <TableCell>{row.metric}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatScore(row.original)}
                        size="small"
                        color={row.metric !== 'Activities' ? getScoreColor(row.original) : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatScore(row.reprocessed)}
                        size="small"
                        color={row.metric !== 'Activities' ? getScoreColor(row.reprocessed) : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <DeltaDisplay value={row.delta} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Apply / Discard buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleApply}
              disabled={applying || discarding}
            >
              {applying ? 'Applying...' : 'Apply Changes'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDiscard}
              disabled={applying || discarding}
            >
              {discarding ? 'Discarding...' : 'Discard'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* D. History */}
      <Accordion expanded={historyExpanded} onChange={handleHistoryToggle}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Reprocessing History</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {history === null ? (
            <CircularProgress size={24} />
          ) : history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No reprocessing history for this drill.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Patch</TableCell>
                    <TableCell align="right">Score Change</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Triggered By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.reprocess_id}>
                      <TableCell>{item.reprocess_id}</TableCell>
                      <TableCell>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {item.patch_id
                          ? <Chip label={item.patch_id} size="small" color="warning" variant="outlined" />
                          : <Typography variant="caption" color="text.secondary">latest</Typography>
                        }
                      </TableCell>
                      <TableCell align="right">
                        <DeltaDisplay value={item.comparison?.total_score_delta} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          color={
                            item.status === 'applied' ? 'success' :
                            item.status === 'pending' ? 'warning' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{item.triggered_by || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ReprocessPanel;
