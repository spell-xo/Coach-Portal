import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as NeutralIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import manualScoringService from '../../api/manualScoringService';

function ScoreComparisonModal({ open, onClose, drill }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && drill?._id) {
      loadComparisonData();
    }
  }, [open, drill]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await manualScoringService.getComparisonData(drill._id);
      setComparisonData(response.data);
    } catch (err) {
      console.error('Error loading comparison data:', err);
      setError(err.response?.data?.message || 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getDifferenceIcon = (diff) => {
    if (diff > 5) return <TrendingUpIcon color="success" fontSize="small" />;
    if (diff < -5) return <TrendingDownIcon color="error" fontSize="small" />;
    return <NeutralIcon color="disabled" fontSize="small" />;
  };

  // Extract a single score value from any granularity type
  const extractScoreValue = (scoreData) => {
    if (!scoreData?.scores) return null;

    // Overall granularity - direct score
    if (scoreData.scores.overall !== undefined) {
      return scoreData.scores.overall;
    }

    // Category granularity - average of categories
    if (scoreData.scores.categories && Object.keys(scoreData.scores.categories).length > 0) {
      const values = Object.values(scoreData.scores.categories);
      return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    // Metric granularity - average of all metric scores
    if (scoreData.scores.metrics && Object.keys(scoreData.scores.metrics).length > 0) {
      const allScores = [];
      Object.values(scoreData.scores.metrics).forEach(metrics => {
        Object.values(metrics).forEach(metricData => {
          const score = metricData?.score ?? metricData;
          if (typeof score === 'number') allScores.push(score);
        });
      });
      if (allScores.length > 0) {
        return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
      }
    }

    // Activity granularity - average of activity scores
    if (scoreData.scores.activities?.length > 0) {
      const scores = scoreData.scores.activities.map(a => a.score);
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    return null;
  };

  const getAverageManualScore = () => {
    if (!comparisonData?.manualScores?.length) return null;

    const extractedScores = comparisonData.manualScores
      .map(s => extractScoreValue(s))
      .filter(s => s !== null);

    if (extractedScores.length === 0) return null;
    return Math.round(extractedScores.reduce((a, b) => a + b, 0) / extractedScores.length);
  };

  const renderScoreBar = (label, score, manualScore = null, maxScore = 100) => {
    const diff = manualScore !== null ? manualScore - score : null;
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body2">{label}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`AI: ${Math.round(score)}`} size="small" color={getScoreColor(score)} />
            {manualScore !== null && (
              <>
                <Chip label={`Manual: ${Math.round(manualScore)}`} size="small" variant="outlined" color={getScoreColor(manualScore)} />
                {diff !== null && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    {getDifferenceIcon(diff)}
                    <Typography variant="caption" color={diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary'}>
                      {diff > 0 ? '+' : ''}{Math.round(diff)}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(score / maxScore) * 100}
          color={getScoreColor(score)}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
    );
  };

  // Get average manual score for a specific area from category-level manual scores
  const getManualAreaScore = (areaName) => {
    if (!comparisonData?.manualScores?.length) return null;

    const categoryScores = comparisonData.manualScores
      .filter(s => s.granularity === 'category' && s.scores?.categories?.[areaName] !== undefined)
      .map(s => s.scores.categories[areaName]);

    // Also check metric granularity scores
    const metricScores = comparisonData.manualScores
      .filter(s => s.granularity === 'metric' && s.scores?.metrics?.[areaName])
      .map(s => {
        const metrics = s.scores.metrics[areaName];
        const scores = Object.values(metrics).map(m => m?.score ?? m).filter(sc => typeof sc === 'number');
        return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      })
      .filter(s => s !== null);

    const allScores = [...categoryScores, ...metricScores];
    if (allScores.length === 0) return null;
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  };

  // Get average manual score for a specific metric within an area
  const getManualMetricScore = (areaName, metricName) => {
    if (!comparisonData?.manualScores?.length) return null;

    const metricScores = comparisonData.manualScores
      .filter(s => s.granularity === 'metric' && s.scores?.metrics?.[areaName]?.[metricName])
      .map(s => {
        const metricData = s.scores.metrics[areaName][metricName];
        return metricData?.score ?? metricData;
      })
      .filter(s => typeof s === 'number');

    if (metricScores.length === 0) return null;
    return Math.round(metricScores.reduce((a, b) => a + b, 0) / metricScores.length);
  };

  const renderComparisonCard = (title, aiScore, manualScore) => {
    const diff = manualScore !== null ? manualScore - aiScore : null;

    return (
      <Paper sx={{ p: 2 }} variant="outlined">
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">AI Score</Typography>
              <Typography variant="h4" color={`${getScoreColor(aiScore)}.main`}>
                {aiScore ?? 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Manual Avg</Typography>
              <Typography variant="h4" color={manualScore ? `${getScoreColor(manualScore)}.main` : 'text.disabled'}>
                {manualScore ?? 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        {diff !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1, gap: 0.5 }}>
            {getDifferenceIcon(diff)}
            <Typography variant="body2" color={diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary'}>
              {diff > 0 ? '+' : ''}{diff} difference
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            AI vs Manual Score Comparison
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {drill && (
          <Typography variant="body2" color="text.secondary">
            {drill.gameType || 'Drill'} - {drill.playerName || 'Unknown Player'}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !comparisonData ? (
          <Alert severity="info">No comparison data available</Alert>
        ) : (
          <Box>
            {/* Tabs for different views */}
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
              <Tab label="Overview" />
              <Tab label="Detailed Metrics" />
              <Tab label="Manual Scores" />
            </Tabs>

            {/* Tab 0: Overview */}
            {activeTab === 0 && (
              <Box>
                {/* Overall Comparison */}
                <Typography variant="h6" gutterBottom>Overall Comparison</Typography>
                {renderComparisonCard(
                  'Total Score',
                  comparisonData.aiScore?.total_score,
                  getAverageManualScore()
                )}

                <Divider sx={{ my: 3 }} />

                {/* Area Score Comparison */}
                {comparisonData.aiScore?.areas && (
                  <>
                    <Typography variant="h6" gutterBottom>Area Comparison (AI vs Manual Avg)</Typography>
                    <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
                      {Object.entries(comparisonData.aiScore.areas).map(([area, data]) => {
                        const aiScore = data?.scores?.raw_score ?? (typeof data === 'number' ? data : null);
                        const manualScore = getManualAreaScore(area);
                        return aiScore !== null ? (
                          <Box key={area}>
                            {renderScoreBar(area, aiScore, manualScore)}
                          </Box>
                        ) : null;
                      })}
                      {Object.keys(comparisonData.aiScore.areas).length === 0 && (
                        <Typography color="text.secondary">No area breakdown available</Typography>
                      )}
                    </Paper>
                  </>
                )}

                {/* Summary Statistics */}
                {comparisonData.manualScores?.length > 0 && (
                  <Paper sx={{ p: 2 }} variant="outlined">
                    <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Manual Scores</Typography>
                        <Typography variant="h5">{comparisonData.manualScores.length}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Coaches</Typography>
                        <Typography variant="h5">
                          {new Set(comparisonData.manualScores.map(s => s.coachId)).size}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Avg Difference</Typography>
                        <Typography variant="h5">
                          {(() => {
                            const aiTotal = comparisonData.aiScore?.total_score;
                            const manualAvg = getAverageManualScore();
                            if (aiTotal === null || aiTotal === undefined || manualAvg === null) return 'N/A';
                            const diff = manualAvg - aiTotal;
                            return `${diff > 0 ? '+' : ''}${Math.round(diff)}`;
                          })()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Box>
            )}

            {/* Tab 1: Detailed Metrics */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Detailed Metric Comparison</Typography>
                {comparisonData.aiScore?.areas ? (
                  Object.entries(comparisonData.aiScore.areas).map(([areaName, areaData]) => {
                    const aiAreaScore = areaData?.scores?.raw_score;
                    const manualAreaScore = getManualAreaScore(areaName);
                    const categories = areaData?.categories || {};

                    return (
                      <Accordion key={areaName} defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                            <Typography sx={{ flexGrow: 1 }}>{areaName}</Typography>
                            {aiAreaScore !== undefined && (
                              <Chip label={`AI: ${Math.round(aiAreaScore)}`} size="small" color={getScoreColor(aiAreaScore)} />
                            )}
                            {manualAreaScore !== null && (
                              <Chip label={`Manual: ${manualAreaScore}`} size="small" variant="outlined" color={getScoreColor(manualAreaScore)} />
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          {Object.keys(categories).length > 0 ? (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Metric</TableCell>
                                    <TableCell align="center">AI Score</TableCell>
                                    <TableCell align="center">Manual Avg</TableCell>
                                    <TableCell align="center">Difference</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {Object.entries(categories).map(([catName, catData]) => {
                                    const aiCatScore = catData?.scores?.score;
                                    const manualCatScore = getManualMetricScore(areaName, catName);
                                    const diff = aiCatScore !== undefined && manualCatScore !== null
                                      ? manualCatScore - aiCatScore
                                      : null;

                                    return (
                                      <TableRow key={catName}>
                                        <TableCell>{catName}</TableCell>
                                        <TableCell align="center">
                                          {aiCatScore !== undefined ? (
                                            <Chip label={Math.round(aiCatScore)} size="small" color={getScoreColor(aiCatScore)} />
                                          ) : (
                                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                                          )}
                                        </TableCell>
                                        <TableCell align="center">
                                          {manualCatScore !== null ? (
                                            <Chip label={manualCatScore} size="small" variant="outlined" color={getScoreColor(manualCatScore)} />
                                          ) : (
                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                          )}
                                        </TableCell>
                                        <TableCell align="center">
                                          {diff !== null ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                              {getDifferenceIcon(diff)}
                                              <Typography
                                                variant="body2"
                                                color={diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary'}
                                              >
                                                {diff > 0 ? '+' : ''}{Math.round(diff)}
                                              </Typography>
                                            </Box>
                                          ) : (
                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No detailed metrics available for this area
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })
                ) : (
                  <Alert severity="info">No AI metrics available for comparison</Alert>
                )}

                {!comparisonData.manualScores?.some(s => s.granularity === 'metric' || s.granularity === 'category') && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No manual scores with category or metric granularity available. Score this drill using category or metric granularity for detailed comparison.
                  </Alert>
                )}
              </Box>
            )}

            {/* Tab 2: Manual Scores */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Manual Scores ({comparisonData.manualScores?.length || 0})
                </Typography>
                {comparisonData.manualScores?.length > 0 ? (
                  <>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Coach</TableCell>
                            <TableCell>Granularity</TableCell>
                            <TableCell align="right">Score</TableCell>
                            <TableCell align="right">vs AI</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {comparisonData.manualScores.map((score) => {
                            const extractedScore = extractScoreValue(score);
                            const aiTotal = comparisonData.aiScore?.total_score;
                            const diff = extractedScore !== null && aiTotal !== undefined
                              ? extractedScore - aiTotal
                              : null;

                            return (
                              <TableRow key={score._id}>
                                <TableCell>{score.coachName}</TableCell>
                                <TableCell>
                                  <Chip label={score.granularity} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell align="right">
                                  {extractedScore !== null ? (
                                    <Chip
                                      label={extractedScore}
                                      size="small"
                                      color={getScoreColor(extractedScore)}
                                    />
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      N/A
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {diff !== null ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                      {getDifferenceIcon(diff)}
                                      <Typography
                                        variant="body2"
                                        color={diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary'}
                                      >
                                        {diff > 0 ? '+' : ''}{Math.round(diff)}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {new Date(score.createdAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Notes from Manual Scores */}
                    {comparisonData.manualScores?.some(s => s.notes) && (
                      <>
                        <Typography variant="h6" gutterBottom>Coach Notes</Typography>
                        {comparisonData.manualScores
                          .filter(s => s.notes)
                          .map((score) => (
                            <Paper key={score._id} sx={{ p: 2, mb: 1 }} variant="outlined">
                              <Typography variant="subtitle2">{score.coachName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {score.notes}
                              </Typography>
                            </Paper>
                          ))}
                      </>
                    )}
                  </>
                ) : (
                  <Alert severity="info">
                    No manual scores yet. Score this drill to see comparison.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ScoreComparisonModal;
