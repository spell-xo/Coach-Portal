import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
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
  Grid,
  LinearProgress,
  Collapse,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VerifiedIcon from '@mui/icons-material/Verified';
import SendIcon from '@mui/icons-material/Send';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import sandboxService from '../../api/sandboxService';
import { selectIsPlatformEngineering } from '../../store/authSlice';
import toast from 'react-hot-toast';

const getStatusColor = (status) => {
  const colors = {
    queued: 'default',
    running: 'info',
    completed: 'success',
    failed: 'error',
    partial: 'warning',
  };
  return colors[status] || 'default';
};

const getRiskColor = (risk) => {
  const colors = { low: 'success', medium: 'warning', high: 'error' };
  return colors[risk] || 'default';
};

const formatDelta = (delta) => {
  if (delta == null) return '-';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}`;
};

const getDeltaColor = (delta) => {
  if (delta > 0) return 'success.main';
  if (delta < 0) return 'error.main';
  return 'text.secondary';
};

const AreaBar = ({ label, original, test }) => {
  const delta = test != null && original != null ? test - original : null;
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption" fontWeight={600}>{label}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">{original ?? '-'}</Typography>
          <Typography variant="caption">&rarr;</Typography>
          <Typography variant="caption" fontWeight={600}>{test ?? '-'}</Typography>
          {delta != null && (
            <Typography variant="caption" fontWeight={700} sx={{ color: getDeltaColor(delta), minWidth: 36, textAlign: 'right' }}>
              {formatDelta(delta)}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(original || 0, 100)}
          sx={{ flex: 1, height: 6, borderRadius: 1, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: 'grey.400' } }}
        />
        <LinearProgress
          variant="determinate"
          value={Math.min(test || 0, 100)}
          sx={{ flex: 1, height: 6, borderRadius: 1 }}
        />
      </Box>
    </Box>
  );
};

const DrillComparisonCard = ({ drill }) => {
  const [expanded, setExpanded] = useState(false);
  const {
    drill_id, game_type, original_score, test_score, delta,
    original_areas, test_areas, area_deltas,
    original_activities, test_activities, error: drillError,
  } = drill;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: expanded ? 2 : '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>
              {drill_id?.slice(-8)}
            </Typography>
            {game_type && (
              <Chip label={game_type.replace(/_/g, ' ')} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
            {drillError && (
              <Chip label="Error" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{original_score?.toFixed(1)}</Typography>
            <Typography variant="body2" color="text.secondary">&rarr;</Typography>
            <Typography variant="body2" fontWeight={700}>{test_score?.toFixed(1)}</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: getDeltaColor(delta), minWidth: 50, textAlign: 'right' }}>
              {formatDelta(delta)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Divider sx={{ my: 1.5 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Area Breakdown
              </Typography>
              {original_areas && test_areas ? (
                Object.keys(test_areas).map((area) => (
                  <AreaBar
                    key={area}
                    label={area}
                    original={original_areas[area]}
                    test={test_areas[area]}
                  />
                ))
              ) : area_deltas ? (
                Object.entries(area_deltas).map(([area, d]) => (
                  <Box key={area} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">{area}</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ color: getDeltaColor(d) }}>
                      {formatDelta(d)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" color="text.secondary">No area data available</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Activity Count
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2">Original: {original_activities ?? '-'}</Typography>
                <Typography variant="body2">&rarr;</Typography>
                <Typography variant="body2" fontWeight={600}>Test: {test_activities ?? '-'}</Typography>
              </Box>
              {drillError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  <Typography variant="caption">{drillError}</Typography>
                </Alert>
              )}
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const SandboxRunDetail = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const { runId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [run, setRun] = useState(null);

  const loadRun = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sandboxService.getRun(runId);
      setRun(data.data || data);
    } catch (err) {
      console.error('Error loading sandbox run:', err);
      setError('Failed to load sandbox run');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    if (isPlatformEngineering && runId) {
      loadRun();
    }
  }, [isPlatformEngineering, runId, loadRun]);

  const handlePropose = async () => {
    if (!run?.patch_id) return;
    try {
      await sandboxService.proposeForIntegration(run.patch_id);
      toast.success('Patch proposed for integration');
      loadRun();
    } catch (err) {
      toast.error(err.message || 'Failed to propose patch');
    }
  };

  if (!isPlatformEngineering) {
    return <Navigate to="/dashboard" replace />;
  }

  const summary = run?.summary;
  const review = run?.review || run?.patch_review;

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
            Back to Dashboard
          </Button>
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
        ) : !run ? (
          <Alert severity="warning">Run not found.</Alert>
        ) : (
          <>
            {/* Header / Patch Info Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {run.run_id || runId}
                  </Typography>
                  <Chip label={run.status} color={getStatusColor(run.status)} size="small" />
                  {run.type && <Chip label={run.type} size="small" variant="outlined" />}
                </Box>
                <IconButton onClick={loadRun} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Patch</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{run.patch_id}</Typography>
                </Grid>
                {run.description && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body2">{run.description}</Typography>
                  </Grid>
                )}
                {run.files_modified?.length > 0 && (
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Files Modified</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {run.files_modified.map((f) => (
                        <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Summary Panel */}
            {summary && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" fontWeight={700}>{summary.drills_tested || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">Drills Tested</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" fontWeight={700} sx={{ color: getDeltaColor(summary.avg_score_delta) }}>
                        {formatDelta(summary.avg_score_delta)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Avg Delta</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {summary.drills_improved || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Improved</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" fontWeight={700} color="error.main">
                        {summary.drills_regressed || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Regressed</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Per-Drill Comparisons */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Per-Drill Comparison
            </Typography>
            {run.drills?.length > 0 ? (
              run.drills.map((drill, idx) => (
                <DrillComparisonCard key={drill.drill_id || idx} drill={drill} />
              ))
            ) : (
              <Alert severity="info">No drill results available.</Alert>
            )}

            {/* DA Review Panel */}
            {review && (
              <>
                <Typography variant="h6" sx={{ mb: 2, mt: 3, fontWeight: 600 }}>
                  Devil's Advocate Review
                </Typography>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {review.risk_level && (
                      <Chip label={`Risk: ${review.risk_level}`} color={getRiskColor(review.risk_level)} size="small" />
                    )}
                    {review.recommendation && (
                      <Chip label={review.recommendation.replace(/_/g, ' ')} size="small" variant="outlined" />
                    )}
                  </Box>
                  {review.concerns?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Concerns</Typography>
                      {review.concerns.map((concern, i) => (
                        <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                          <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                            <Chip label={concern.type?.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                            {concern.severity && (
                              <Chip label={concern.severity} size="small" color={getRiskColor(concern.severity)} sx={{ height: 18, fontSize: '0.6rem' }} />
                            )}
                          </Box>
                          <Typography variant="body2">{concern.description}</Typography>
                          {concern.suggested_test && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                              Suggested test: {concern.suggested_test}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  )}
                  {review.alternative_approaches?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Alternative Approaches</Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {review.alternative_approaches.map((alt, i) => (
                          <li key={i}><Typography variant="body2">{alt}</Typography></li>
                        ))}
                      </ul>
                    </Box>
                  )}
                  {review.test_recommendations?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Test Recommendations</Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {review.test_recommendations.map((rec, i) => (
                          <li key={i}><Typography variant="body2">{rec}</Typography></li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Paper>
              </>
            )}

            {/* Action Bar */}
            <Paper sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => toast('Tweak Patch — use the wizard to propose changes')}>
                Tweak Patch
              </Button>
              <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={() => toast('Run More Drills — use the wizard to test more drills')}>
                Run More Drills
              </Button>
              <Button variant="outlined" startIcon={<VerifiedIcon />} onClick={() => toast('Run Validation — use the wizard to start a validation run')}>
                Run Validation
              </Button>
              <Button variant="contained" startIcon={<SendIcon />} onClick={handlePropose}>
                Propose for Integration
              </Button>
            </Paper>
          </>
        )}
      </Container>
    </AppLayout>
  );
};

export default SandboxRunDetail;
