import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Tab,
  Tabs,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArchiveIcon from '@mui/icons-material/Archive';
import TextField from '@mui/material/TextField';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import engineeringService from '../../api/engineeringService';
import { selectIsPlatformEngineering } from '../../store/authSlice';
import { showToast } from '../../utils/toast';

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'validated', label: 'Validated' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'report_ready', label: 'Report Ready' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed' },
];

const SEVERITIES = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const getSeverityColor = (severity) => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'default',
  };
  return colors[severity] || 'default';
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'default',
    under_review: 'info',
    validated: 'primary',
    in_progress: 'warning',
    report_ready: 'success',
    approved: 'success',
    rejected: 'error',
    closed: 'default',
  };
  return colors[status] || 'default';
};

const formatStatus = (status) => {
  if (!status) return 'N/A';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const EngineeringInvestigations = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Close investigation flow
  const [closeMode, setCloseMode] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);

  // Investigation trigger
  const [investigatingId, setInvestigatingId] = useState(null);
  const [pollingRef] = useState({ current: null });

  // Re-investigate context dialog
  const [reinvestigateOpen, setReinvestigateOpen] = useState(false);
  const [reinvestigateContext, setReinvestigateContext] = useState('');

  // Detail dialog tab
  const [detailTab, setDetailTab] = useState(0);

  // Patch & Test
  const [patchGenerating, setPatchGenerating] = useState(false);
  const [patchTesting, setPatchTesting] = useState(false);
  const patchPollInterval = useRef(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: 50, offset: 0 };
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;

      const response = await engineeringService.listRequests(params);
      const data = response.data;
      if (data.success) {
        setRequests(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error loading engineering requests:', err);
      setError('Failed to load engineering requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    if (isPlatformEngineering) {
      loadRequests();
    }
  }, [isPlatformEngineering, loadRequests]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (patchPollInterval.current) clearInterval(patchPollInterval.current);
    };
  }, [pollingRef]);

  // Auto-resume polling if any request is in_progress on page load
  useEffect(() => {
    if (!loading && requests.length > 0 && !investigatingId) {
      const inProgress = requests.find((r) => r.status === 'in_progress');
      if (inProgress) {
        setInvestigatingId(inProgress.request_id);
        startPolling(inProgress.request_id);
      }
    }
  }, [loading, requests]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRowClick = async (request) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setSelectedRequest(null);

      const response = await engineeringService.getRequest(request.request_id);
      const data = response.data;
      if (data.success) {
        setSelectedRequest(data.data);
      }
    } catch (err) {
      console.error('Error loading request detail:', err);
      setError('Failed to load request details');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedRequest(null);
    setCloseMode(false);
    setCloseReason('');
    setCloseNotes('');
    setDetailTab(0);
    setReinvestigateOpen(false);
    setReinvestigateContext('');
    setPatchGenerating(false);
    setPatchTesting(false);
    if (patchPollInterval.current) {
      clearInterval(patchPollInterval.current);
      patchPollInterval.current = null;
    }
  };

  const handleCloseInvestigation = async () => {
    if (!closeReason || !selectedRequest) return;
    try {
      setCloseLoading(true);
      await engineeringService.closeRequest(selectedRequest.request_id, {
        closed_reason: closeReason,
        resolution_notes: closeNotes || undefined,
      });
      handleCloseDetail();
      loadRequests();
    } catch (err) {
      console.error('Error closing investigation:', err);
      setError('Failed to close investigation');
    } finally {
      setCloseLoading(false);
    }
  };

  const startPolling = useCallback((requestId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const startTime = Date.now();
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

    pollingRef.current = setInterval(async () => {
      try {
        // Safety timeout
        if (Date.now() - startTime > TIMEOUT_MS) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setInvestigatingId(null);
          showToast.warning('Investigation polling timed out. Refresh to check status.');
          return;
        }

        const response = await engineeringService.getRequest(requestId);
        const data = response.data;
        if (!data.success) return;

        const status = data.data?.status;

        if (status === 'report_ready') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setInvestigatingId(null);
          showToast.success(`Investigation complete for ${requestId}`);
          loadRequests();
          // Refresh detail if it's open
          if (selectedRequest?.request_id === requestId) {
            setSelectedRequest(data.data);
          }
        } else if (status === 'validated') {
          // Reverted — investigation failed
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setInvestigatingId(null);
          showToast.error(`Investigation failed for ${requestId}`);
          loadRequests();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 10000); // Poll every 10 seconds
  }, [loadRequests, selectedRequest, pollingRef]);

  const handleTriggerInvestigation = async (additionalContext) => {
    if (!selectedRequest || investigatingId) return;
    const requestId = selectedRequest.request_id;

    try {
      const opts = additionalContext ? { additional_context: additionalContext } : {};
      await engineeringService.triggerInvestigation(requestId, opts);
      setInvestigatingId(requestId);
      setSelectedRequest({ ...selectedRequest, status: 'in_progress', report_markdown: null });
      showToast.info(`Investigation started for ${requestId}`);
      startPolling(requestId);
    } catch (err) {
      console.error('Error triggering investigation:', err);
      showToast.error('Failed to trigger investigation');
    }
  };

  const handleReinvestigate = () => {
    setReinvestigateContext('');
    setReinvestigateOpen(true);
  };

  const handleConfirmReinvestigate = () => {
    setReinvestigateOpen(false);
    handleTriggerInvestigation(reinvestigateContext || undefined);
  };

  const handleGeneratePatch = async () => {
    if (!selectedRequest || patchGenerating) return;
    const requestId = selectedRequest.request_id;

    try {
      setPatchGenerating(true);
      await engineeringService.generatePatch(requestId);
      showToast.info(`Patch generation started for ${requestId}`);

      // Poll for patch to appear in related_patches
      const startTime = Date.now();
      const TIMEOUT_MS = 5 * 60 * 1000;

      patchPollInterval.current = setInterval(async () => {
        try {
          if (Date.now() - startTime > TIMEOUT_MS) {
            clearInterval(patchPollInterval.current);
            patchPollInterval.current = null;
            setPatchGenerating(false);
            showToast.warning('Patch generation timed out. Refresh to check status.');
            return;
          }

          const response = await engineeringService.getRequest(requestId);
          const data = response.data;
          if (!data.success) return;

          if (data.data?.patch_info) {
            clearInterval(patchPollInterval.current);
            patchPollInterval.current = null;
            setPatchGenerating(false);
            setSelectedRequest(data.data);
            showToast.success(`Patch ${data.data.patch_info.patch_id} generated`);
          }
        } catch (err) {
          console.error('Patch poll error:', err);
        }
      }, 10000);
    } catch (err) {
      console.error('Error generating patch:', err);
      setPatchGenerating(false);
      showToast.error('Failed to start patch generation');
    }
  };

  const handleTestPatch = async () => {
    if (!selectedRequest || patchTesting) return;
    const requestId = selectedRequest.request_id;

    try {
      setPatchTesting(true);
      const response = await engineeringService.testPatch(requestId);
      const data = response.data;

      if (data.success) {
        showToast.success('Patch test complete');
        // Refresh the request to get updated patch_info with test results
        const refreshed = await engineeringService.getRequest(requestId);
        if (refreshed.data?.success) {
          setSelectedRequest(refreshed.data.data);
        }
      } else {
        showToast.error(data.error || 'Patch test failed');
      }
    } catch (err) {
      console.error('Error testing patch:', err);
      showToast.error('Failed to run patch test');
    } finally {
      setPatchTesting(false);
    }
  };

  if (!isPlatformEngineering) {
    return <Navigate to="/dashboard" replace />;
  }

  const hasReport = selectedRequest?.report_markdown;
  const canShowPatchTab = selectedRequest && ['report_ready', 'approved', 'closed'].includes(selectedRequest.status);
  const patchInfo = selectedRequest?.patch_info;

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Engineering Investigations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View investigation requests and reports
            </Typography>
          </Box>
          <IconButton onClick={loadRequests} disabled={loading}>
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
                  {STATUSES.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  label="Severity"
                >
                  {SEVERITIES.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                {total} investigation{total !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Requests Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Alert severity="info">
            No engineering investigations found.
          </Alert>
        ) : (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Request ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Requested By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Pipeline Stage</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Investigated By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.request_id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(request)}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {request.request_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.created_by_email || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatStatus(request.severity)}
                          size="small"
                          color={getSeverityColor(request.severity)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={formatStatus(request.status)}
                            size="small"
                            color={getStatusColor(request.status)}
                            variant="outlined"
                          />
                          {request.status === 'in_progress' && (
                            <CircularProgress size={16} />
                          )}
                          {request.status === 'validated' && request.resolution_notes &&
                            /^Investigation (failed|error)/i.test(request.resolution_notes) && (
                            <Chip label="Failed" size="small" color="error" variant="filled" sx={{ fontSize: '0.7rem', height: 20 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatStatus(request.pipeline_stage)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {request.investigated_by || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="lg" fullWidth>
          <DialogTitle>
            {detailLoading ? 'Loading...' : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {selectedRequest?.request_id}
                </Typography>
                {selectedRequest?.severity && (
                  <Chip
                    label={formatStatus(selectedRequest.severity)}
                    size="small"
                    color={getSeverityColor(selectedRequest.severity)}
                  />
                )}
                {selectedRequest?.status && (
                  <Chip
                    label={formatStatus(selectedRequest.status)}
                    size="small"
                    color={getStatusColor(selectedRequest.status)}
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </DialogTitle>
          <DialogContent dividers>
            {detailLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : selectedRequest ? (
              <Box>
                <Tabs
                  value={detailTab}
                  onChange={(_, v) => setDetailTab(v)}
                  sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                >
                  <Tab label="Details" />
                  <Tab
                    label="Report"
                    disabled={!hasReport}
                    sx={hasReport ? { fontWeight: 600 } : {}}
                  />
                  <Tab
                    label="Patch & Test"
                    disabled={!canShowPatchTab}
                    sx={patchInfo ? { fontWeight: 600 } : {}}
                  />
                </Tabs>

                {/* ========== TAB 0: DETAILS ========== */}
                {detailTab === 0 && (
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                      Request
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      {selectedRequest.title}
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Requested By</Typography>
                        <Typography variant="body2">{selectedRequest.created_by_email || selectedRequest.created_by || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Created</Typography>
                        <Typography variant="body2">{formatDate(selectedRequest.created_at)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Pipeline Stage</Typography>
                        <Typography variant="body2">{formatStatus(selectedRequest.pipeline_stage)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Drill Type</Typography>
                        <Typography variant="body2">{selectedRequest.drill_type ? formatStatus(selectedRequest.drill_type) : 'N/A'}</Typography>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Drill ID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {selectedRequest.drill_id || 'N/A'}
                        </Typography>
                      </Grid>
                      {selectedRequest.video_upload_id && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Video Upload ID</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {selectedRequest.video_upload_id}
                          </Typography>
                        </Grid>
                      )}
                      {selectedRequest.total_score != null && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Total Score</Typography>
                          <Typography variant="body2">{selectedRequest.total_score}</Typography>
                        </Grid>
                      )}
                      {selectedRequest.source_session_id && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Wizard Session</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {selectedRequest.source_session_id}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    {/* Findings */}
                    {selectedRequest.findings && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                          Findings
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {typeof selectedRequest.findings === 'string'
                              ? selectedRequest.findings
                              : JSON.stringify(selectedRequest.findings, null, 2)}
                          </ReactMarkdown>
                        </Paper>
                      </>
                    )}

                    {/* Suggested Investigation */}
                    {selectedRequest.suggested_investigation?.length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                          Suggested Investigation Areas
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {selectedRequest.suggested_investigation.map((item, i) => (
                              <li key={i}>
                                <Typography variant="body2">{item}</Typography>
                              </li>
                            ))}
                          </ul>
                        </Paper>
                      </>
                    )}

                    {/* Version Info */}
                    {selectedRequest.version_info && Object.keys(selectedRequest.version_info).length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                          Version Info
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                          <Grid container spacing={1}>
                            {Object.entries(selectedRequest.version_info).map(([key, value]) => (
                              <Grid item xs={6} sm={4} key={key}>
                                <Typography variant="caption" color="text.secondary">{key}</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                  {String(value)}
                                </Typography>
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      </>
                    )}

                    {/* Review Section */}
                    {(selectedRequest.review_status || selectedRequest.review_notes) && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                          Review
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 1 }}>
                          {selectedRequest.review_status && (
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Review Status</Typography>
                              <Box>
                                <Chip
                                  label={formatStatus(selectedRequest.review_status)}
                                  size="small"
                                  color={selectedRequest.review_status === 'passed' ? 'success' : 'error'}
                                />
                              </Box>
                            </Grid>
                          )}
                          {selectedRequest.reviewed_at && (
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Reviewed At</Typography>
                              <Typography variant="body2">{formatDate(selectedRequest.reviewed_at)}</Typography>
                            </Grid>
                          )}
                        </Grid>
                        {selectedRequest.review_notes && (
                          <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {selectedRequest.review_notes}
                            </Typography>
                          </Paper>
                        )}
                        {selectedRequest.review_flags?.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {selectedRequest.review_flags.map((flag, i) => (
                              <Chip key={i} label={flag} size="small" color="warning" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      </>
                    )}

                    {/* Investigation Failure Alert */}
                    {selectedRequest.status === 'validated' && selectedRequest.resolution_notes &&
                      /^Investigation (failed|error)/i.test(selectedRequest.resolution_notes) && (
                      <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
                        The last investigation attempt failed. You can retry by clicking Investigate below.
                      </Alert>
                    )}

                    {/* Resolution Notes */}
                    {selectedRequest.resolution_notes && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Resolution Notes
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            backgroundColor: /^Investigation (failed|error)/i.test(selectedRequest.resolution_notes)
                              ? 'error.50' : 'grey.50',
                            borderColor: /^Investigation (failed|error)/i.test(selectedRequest.resolution_notes)
                              ? 'error.main' : undefined,
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {selectedRequest.resolution_notes}
                          </Typography>
                        </Paper>
                      </>
                    )}

                    {/* Closed Info */}
                    {selectedRequest.status === 'closed' && selectedRequest.closed_reason && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                          Closure
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 1 }}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Reason</Typography>
                            <Typography variant="body2">{formatStatus(selectedRequest.closed_reason)}</Typography>
                          </Grid>
                          {selectedRequest.closed_at && (
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Closed At</Typography>
                              <Typography variant="body2">{formatDate(selectedRequest.closed_at)}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </>
                    )}

                    {/* Close Investigation Inline Form */}
                    {closeMode && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                          Close Investigation
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small" required>
                              <InputLabel>Reason</InputLabel>
                              <Select
                                value={closeReason}
                                onChange={(e) => setCloseReason(e.target.value)}
                                label="Reason"
                              >
                                <MenuItem value="implemented">Implemented</MenuItem>
                                <MenuItem value="superseded">Superseded</MenuItem>
                                <MenuItem value="wont_fix">Won't Fix</MenuItem>
                                <MenuItem value="obsolete">Obsolete</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Resolution Notes (optional)"
                              multiline
                              rows={2}
                              value={closeNotes}
                              onChange={(e) => setCloseNotes(e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                disabled={!closeReason || closeLoading}
                                onClick={handleCloseInvestigation}
                              >
                                {closeLoading ? 'Closing...' : 'Confirm Close'}
                              </Button>
                              <Button
                                size="small"
                                onClick={() => { setCloseMode(false); setCloseReason(''); setCloseNotes(''); }}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </Box>
                )}

                {/* ========== TAB 1: REPORT ========== */}
                {detailTab === 1 && hasReport && (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      {selectedRequest.investigated_by && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Investigated By</Typography>
                          <Typography variant="body2">{selectedRequest.investigated_by}</Typography>
                        </Grid>
                      )}
                      {selectedRequest.investigated_at && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Investigated At</Typography>
                          <Typography variant="body2">{formatDate(selectedRequest.investigated_at)}</Typography>
                        </Grid>
                      )}
                    </Grid>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        backgroundColor: 'grey.50',
                        '& table': {
                          borderCollapse: 'collapse',
                          width: '100%',
                          mb: 2,
                        },
                        '& th, & td': {
                          border: '1px solid',
                          borderColor: 'divider',
                          p: 1,
                          textAlign: 'left',
                        },
                        '& th': {
                          backgroundColor: 'grey.200',
                          fontWeight: 600,
                        },
                        '& pre': {
                          backgroundColor: 'grey.900',
                          color: 'grey.100',
                          p: 2,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.85rem',
                        },
                        '& code': {
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                        },
                        '& h1, & h2, & h3, & h4': {
                          mt: 2,
                          mb: 1,
                        },
                        '& p': {
                          mb: 1,
                        },
                        '& ul, & ol': {
                          pl: 3,
                          mb: 1,
                        },
                      }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedRequest.report_markdown}
                      </ReactMarkdown>
                    </Paper>
                  </Box>
                )}

                {/* ========== TAB 2: PATCH & TEST ========== */}
                {detailTab === 2 && canShowPatchTab && (
                  <Box>
                    {/* State 1: No patch yet */}
                    {!patchInfo && !patchGenerating && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                          Generate a code patch based on the investigation's recommended fix
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={handleGeneratePatch}
                          disabled={selectedRequest.status !== 'report_ready'}
                        >
                          Generate Patch
                        </Button>
                      </Box>
                    )}

                    {/* Generating spinner */}
                    {patchGenerating && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          Generating patch...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          The AI agent is analyzing the report and creating a code patch. This may take a few minutes.
                        </Typography>
                      </Box>
                    )}

                    {/* State 2 & 3: Patch exists */}
                    {patchInfo && (
                      <Box>
                        {/* Patch info card */}
                        <Card variant="outlined" sx={{ mb: 3 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                {patchInfo.patch_id}
                              </Typography>
                              <Chip
                                label={formatStatus(patchInfo.status)}
                                size="small"
                                color={patchInfo.status === 'validated' ? 'success' : patchInfo.status === 'rejected' ? 'error' : 'default'}
                                variant="outlined"
                              />
                            </Box>
                            {patchInfo.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {patchInfo.description}
                              </Typography>
                            )}
                            {patchInfo.files_modified?.length > 0 && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Files Modified
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                  {patchInfo.files_modified.map((f, i) => (
                                    <Chip key={i} label={f} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </CardContent>
                        </Card>

                        {/* No test yet — show Test button */}
                        {!patchInfo.latest_test && !patchTesting && (
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Run the patched code against the original drill to verify the fix
                            </Typography>
                            <Button
                              variant="contained"
                              onClick={handleTestPatch}
                            >
                              Test Patch
                            </Button>
                          </Box>
                        )}

                        {/* Testing spinner */}
                        {patchTesting && (
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                              Running test...
                            </Typography>
                          </Box>
                        )}

                        {/* State 3: Test results */}
                        {patchInfo.latest_test && !patchTesting && (
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Test Results ({patchInfo.latest_test.run_id})
                              </Typography>

                              {patchInfo.latest_test.status === 'failed' && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                  Test run failed. You can re-test to try again.
                                  {patchInfo.latest_test.drill_results?.[0]?.error && (
                                    <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                                      {patchInfo.latest_test.drill_results[0].error}
                                    </Typography>
                                  )}
                                </Alert>
                              )}

                              {patchInfo.latest_test.drill_results?.length > 0 && (() => {
                                const dr = patchInfo.latest_test.drill_results[0];
                                const delta = dr.delta ?? (dr.test_score - dr.original_score);
                                const improved = delta > 0;
                                const unchanged = delta === 0;

                                return (
                                  <Box>
                                    {/* Score comparison */}
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                      <Grid item xs={4}>
                                        <Typography variant="caption" color="text.secondary">Original Score</Typography>
                                        <Typography variant="h5">{dr.original_score ?? 'N/A'}</Typography>
                                      </Grid>
                                      <Grid item xs={4}>
                                        <Typography variant="caption" color="text.secondary">Test Score</Typography>
                                        <Typography variant="h5">{dr.test_score ?? 'N/A'}</Typography>
                                      </Grid>
                                      <Grid item xs={4}>
                                        <Typography variant="caption" color="text.secondary">Delta</Typography>
                                        <Typography
                                          variant="h5"
                                          sx={{ color: improved ? 'success.main' : unchanged ? 'text.secondary' : 'error.main' }}
                                        >
                                          {delta > 0 ? '+' : ''}{typeof delta === 'number' ? delta.toFixed(1) : 'N/A'}
                                        </Typography>
                                      </Grid>
                                    </Grid>

                                    {/* Status chip */}
                                    <Box sx={{ mb: 2 }}>
                                      <Chip
                                        label={improved ? 'Improved' : unchanged ? 'Unchanged' : 'Regressed'}
                                        color={improved ? 'success' : unchanged ? 'default' : 'error'}
                                        size="small"
                                      />
                                    </Box>

                                    {/* Area breakdown */}
                                    {dr.area_deltas && Object.keys(dr.area_deltas).length > 0 && (
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                                          Area Breakdown
                                        </Typography>
                                        {Object.entries(dr.area_deltas).map(([area, areaDelta]) => {
                                          const origVal = dr.original_areas?.[area] ?? 0;
                                          const testVal = dr.test_areas?.[area] ?? 0;
                                          return (
                                            <Box key={area} sx={{ mb: 1 }}>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2">{formatStatus(area)}</Typography>
                                                <Typography variant="body2" sx={{
                                                  color: areaDelta > 0 ? 'success.main' : areaDelta < 0 ? 'error.main' : 'text.secondary',
                                                }}>
                                                  {origVal} → {testVal} ({areaDelta > 0 ? '+' : ''}{typeof areaDelta === 'number' ? areaDelta.toFixed(1) : areaDelta})
                                                </Typography>
                                              </Box>
                                              <LinearProgress
                                                variant="determinate"
                                                value={Math.min(Math.max(testVal, 0), 100)}
                                                sx={{ height: 6, borderRadius: 3 }}
                                              />
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    )}

                                    {/* Activity count change */}
                                    {(dr.original_activities != null || dr.test_activities != null) && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                          Activities Detected
                                        </Typography>
                                        <Typography variant="body2">
                                          {dr.original_activities ?? 'N/A'} → {dr.test_activities ?? 'N/A'}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })()}

                              {/* Summary stats from run */}
                              {patchInfo.latest_test.summary && !patchInfo.latest_test.drill_results?.length && (
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Avg Score Delta: {patchInfo.latest_test.summary.avg_score_delta?.toFixed(1) ?? 'N/A'}
                                  </Typography>
                                </Box>
                              )}

                              {/* Re-test button */}
                              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Button variant="outlined" size="small" onClick={handleTestPatch}>
                                  Re-test
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions>
            {selectedRequest?.status === 'validated' && !investigatingId && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleTriggerInvestigation()}
              >
                Investigate
              </Button>
            )}
            {selectedRequest?.status === 'report_ready' && !investigatingId && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleReinvestigate}
              >
                Re-investigate
              </Button>
            )}
            {selectedRequest?.status === 'in_progress' && (
              <Button disabled startIcon={<CircularProgress size={16} />}>
                Investigating...
              </Button>
            )}
            {selectedRequest && ['report_ready', 'approved'].includes(selectedRequest.status) && !closeMode && (
              <Button
                startIcon={<ArchiveIcon />}
                color="error"
                onClick={() => setCloseMode(true)}
              >
                Close Investigation
              </Button>
            )}
            <Button onClick={handleCloseDetail}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Re-investigate Context Dialog */}
        <Dialog open={reinvestigateOpen} onClose={() => setReinvestigateOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Re-investigate {selectedRequest?.request_id}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Provide additional context or instructions to guide the revised investigation.
              Describe what the previous report missed, got wrong, or what specific areas to focus on.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Additional investigation context"
              placeholder="e.g., The previous report didn't check whether manual cone annotations are applied before PCA clustering. Focus specifically on the data flow from videoUploads.manualAnnotation through to the cone_df passed to group_cones_pca."
              value={reinvestigateContext}
              onChange={(e) => setReinvestigateContext(e.target.value)}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReinvestigateOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleConfirmReinvestigate}
              disabled={!reinvestigateContext.trim()}
            >
              Start Re-investigation
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default EngineeringInvestigations;
