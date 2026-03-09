import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  Divider,
  Menu,
  MenuItem,
  ListItemText,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import bulkJobService from '../../api/bulkJobService';
import JobReport from './JobReport';

const POLL_INTERVAL = 5000;

const STATUS_COLORS = {
  queued: 'default',
  running: 'primary',
  paused: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'warning',
};

const JobsPanel = ({ selectedDrills, onActiveJobCountChange }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);
  const [rerunMenuAnchor, setRerunMenuAnchor] = useState(null);
  const [rerunMenuJobId, setRerunMenuJobId] = useState(null);
  const pollRef = useRef(null);
  const onActiveJobCountChangeRef = useRef(onActiveJobCountChange);
  onActiveJobCountChangeRef.current = onActiveJobCountChange;

  // Stable fetch function that never changes identity
  const fetchJobs = useCallback(async () => {
    try {
      const result = await bulkJobService.listJobs(null, 50);
      const data = result.data || [];
      setJobs(data);

      const activeCount = data.filter(
        (j) => j.status === 'queued' || j.status === 'running' || j.status === 'paused'
      ).length;
      if (onActiveJobCountChangeRef.current) onActiveJobCountChangeRef.current(activeCount);

      setError(null);
    } catch (err) {
      // Only show error if we have no data yet (first load failure)
      // Silently ignore transient poll failures when we already have data
      setError((prev) => prev || (jobs.length === 0 ? err.message : null));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load, then poll every 5s
  useEffect(() => {
    fetchJobs();
    pollRef.current = setInterval(fetchJobs, POLL_INTERVAL);
    return () => {
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [fetchJobs]);

  const handleCancel = async (jobId, e) => {
    e.stopPropagation();
    try {
      await bulkJobService.cancelJob(jobId);
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePause = async (jobId, e) => {
    e.stopPropagation();
    try {
      await bulkJobService.pauseJob(jobId);
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResume = async (jobId, statuses = null, e) => {
    if (e) e.stopPropagation();
    setRerunMenuAnchor(null);
    setRerunMenuJobId(null);
    try {
      await bulkJobService.resumeJob(jobId, statuses);
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRerunMenuOpen = (jobId, e) => {
    e.stopPropagation();
    setRerunMenuAnchor(e.currentTarget);
    setRerunMenuJobId(jobId);
  };

  const handleRerunMenuClose = () => {
    setRerunMenuAnchor(null);
    setRerunMenuJobId(null);
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const activeJobs = jobs.filter((j) => j.status === 'queued' || j.status === 'running' || j.status === 'paused');
  const recentJobs = jobs.filter((j) => j.status !== 'queued' && j.status !== 'running' && j.status !== 'paused');

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      {loading && jobs.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            ACTIVE JOBS
          </Typography>
          {activeJobs.map((job) => (
            <Box
              key={job.job_id}
              sx={{
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 1,
                p: 1.5,
                mb: 1,
                bgcolor: 'primary.50',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {job.job_id}: Gemini Validation
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Started {formatTimeAgo(job.started_at || job.created_at)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {job.status === 'running' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => handlePause(job.job_id, e)}
                      sx={{ fontSize: '0.65rem', py: 0, px: 1, minWidth: 0, height: 22 }}
                    >
                      Pause
                    </Button>
                  )}
                  {job.status === 'paused' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => handleResume(job.job_id, null, e)}
                      sx={{ fontSize: '0.65rem', py: 0, px: 1, minWidth: 0, height: 22 }}
                    >
                      Resume
                    </Button>
                  )}
                  <IconButton size="small" onClick={(e) => handleCancel(job.job_id, e)} title="Cancel">
                    <CancelIcon fontSize="small" color="error" />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ mb: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={job.progress?.percentage || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {job.progress?.percentage || 0}% ({job.progress?.processed || 0}/{job.progress?.total || 0})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {job.progress?.succeeded > 0 && (
                    <Typography variant="caption" color="success.main">
                      {job.progress.succeeded} ok
                    </Typography>
                  )}
                  {job.progress?.failed > 0 && (
                    <Typography variant="caption" color="error.main">
                      {job.progress.failed} failed
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Recent Jobs */}
      <Box>
        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          RECENT JOBS
        </Typography>
        {recentJobs.length === 0 && activeJobs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No jobs yet. Start a bulk validation from the Chat tab.
          </Typography>
        ) : recentJobs.length === 0 ? null : (
          recentJobs.map((job) => (
            <Box key={job.job_id}>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => setExpandedJob(expandedJob === job.job_id ? null : job.job_id)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {job.status === 'completed' && <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                    {job.status === 'failed' && <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                    {job.status === 'cancelled' && <CancelIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                    <Typography variant="body2" fontWeight="bold">
                      {job.job_id}
                    </Typography>
                    <Chip label={job.status} size="small" color={STATUS_COLORS[job.status] || 'default'} sx={{ height: 20, fontSize: '0.65rem' }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {(job.status === 'failed' || job.status === 'completed' || job.status === 'running') &&
                      ((job.progress?.failed || 0) + (job.progress?.skipped || 0)) > 0 && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => handleRerunMenuOpen(job.job_id, e)}
                          endIcon={<ArrowDropDownIcon sx={{ fontSize: '14px !important', ml: -0.5 }} />}
                          sx={{ fontSize: '0.65rem', py: 0, px: 1, minWidth: 0, height: 22 }}
                        >
                          Re-run
                        </Button>
                      </>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeAgo(job.completed_at || job.updated_at)}
                    </Typography>
                    {expandedJob === job.job_id ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {job.progress?.total || 0} drills
                  {job.progress?.succeeded > 0 && ` · ${job.progress.succeeded} succeeded`}
                  {job.progress?.failed > 0 && ` · ${job.progress.failed} failed`}
                  {job.summary?.duration_seconds != null && ` · ${(() => { const s = job.summary.duration_seconds; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`; })()}`}
                </Typography>
              </Box>
              <Collapse in={expandedJob === job.job_id}>
                <JobReport jobId={job.job_id} />
              </Collapse>
            </Box>
          ))
        )}
      </Box>

      {/* Re-run dropdown menu */}
      <Menu
        anchorEl={rerunMenuAnchor}
        open={Boolean(rerunMenuAnchor)}
        onClose={handleRerunMenuClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        {(() => {
          const menuJob = jobs.find((j) => j.job_id === rerunMenuJobId);
          if (!menuJob) return null;
          const failedCount = menuJob.progress?.failed || 0;
          const skippedCount = menuJob.progress?.skipped || 0;
          const allCount = failedCount + skippedCount;
          return [
            allCount > 0 && (
              <MenuItem key="all" onClick={() => handleResume(rerunMenuJobId, ['failed', 'skipped'])}>
                <ListItemText
                  primary={`Re-run All (${allCount})`}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondary="Reset failed + skipped items"
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </MenuItem>
            ),
            failedCount > 0 && (
              <MenuItem key="failed" onClick={() => handleResume(rerunMenuJobId, ['failed'])}>
                <ListItemText
                  primary={`Re-run Failed (${failedCount})`}
                  primaryTypographyProps={{ variant: 'body2', color: 'error.main' }}
                  secondary="Retry only failed items"
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </MenuItem>
            ),
            skippedCount > 0 && (
              <MenuItem key="skipped" onClick={() => handleResume(rerunMenuJobId, ['skipped'])}>
                <ListItemText
                  primary={`Re-run Skipped (${skippedCount})`}
                  primaryTypographyProps={{ variant: 'body2', color: 'warning.main' }}
                  secondary="Re-process skipped items"
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </MenuItem>
            ),
          ];
        })()}
      </Menu>
    </Box>
  );
};

export default JobsPanel;
