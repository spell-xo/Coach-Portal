import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Chip,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import playerService from '../api/playerService';
import DrillReportProfessional from './DrillReportProfessional';

const DrillScoreItem = ({ data, title }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const formatPercentScore = (score) => {
    return score !== null && score !== undefined ? `${Math.round(score)}%` : 'N/A';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Work';
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Tooltip title={data.description || ''} placement="top">
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Chip
              label={getScoreStatus(data?.scores?.raw_score)}
              size="small"
              color={data?.scores?.raw_score >= 80 ? 'success' : data?.scores?.raw_score >= 60 ? 'warning' : 'error'}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              {formatPercentScore(data?.scores?.raw_score)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${data?.scores?.attempted_pattern_count || 0} of ${data?.scores?.pattern_count || 5}`}
                size="small"
                variant="outlined"
              />
              <VideocamIcon fontSize="small" />
            </Box>
          </Box>

          {/* Category breakdown */}
          {data?.categories && Object.entries(data.categories).length > 0 && (
            <Box sx={{ mt: 2 }}>
              {Object.entries(data.categories).map(([key, value]) => (
                <Box key={key} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{key}</Typography>
                    <Chip
                      label={getScoreStatus(value.scores?.score)}
                      size="small"
                      color={value.scores?.score >= 80 ? 'success' : value.scores?.score >= 60 ? 'warning' : 'error'}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {formatPercentScore(value.scores?.score)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={value.scores?.score || 0}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(value.scores?.score)
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Tooltip>
    </Paper>
  );
};

const ClipPlayer = ({ src, startTime, endTime }) => {
  const videoRef = React.useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && src) {
      video.currentTime = startTime;

      const handleTimeUpdate = () => {
        if (video.currentTime >= endTime) {
          video.pause();
          video.currentTime = startTime;
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [src, startTime, endTime]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: '100%', maxHeight: '200px', borderRadius: '8px' }}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

const DrillReport = ({ drill, scores, highlights, playerName }) => {
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const formatPercentScore = (score) => {
    return score !== null && score !== undefined ? `${Math.round(score)}%` : 'N/A';
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString() : 'N/A';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`drill-report-${drill?.gameType}-${formatDate(drill?.uploadDate)}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportToPDF}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : 'Export to PDF'}
        </Button>
      </Box>

      <Paper ref={reportRef} sx={{ p: 4, bgcolor: 'white' }}>
        {/* Report Header */}
        <Box sx={{ mb: 4, textAlign: 'center', borderBottom: '2px solid #1976d2', pb: 2 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Drill Performance Report
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {drill?.gameType || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Player: {playerName || 'N/A'} | Date: {formatDate(drill?.uploadDate)}
          </Typography>
        </Box>

        {/* Overall Performance Summary */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Overall Performance Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Total Score</Typography>
                <Typography variant="h3" fontWeight="bold">
                  {formatPercentScore(scores?.total_score)}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  Grade: {getScoreGrade(scores?.total_score)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Drill Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Upload Date:</Typography>
                    <Typography variant="body1">{formatDate(drill?.uploadDate)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Completed Date:</Typography>
                    <Typography variant="body1">{formatDate(drill?.completedAt)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Chip label={drill?.status || 'N/A'} size="small" color="success" />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Drill Type:</Typography>
                    <Typography variant="body1">{drill?.gameType || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Performance Breakdown by Area */}
        {scores?.areas && Object.keys(scores.areas).length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Performance Breakdown by Area
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Performance Area</strong></TableCell>
                    <TableCell align="center"><strong>Score</strong></TableCell>
                    <TableCell align="center"><strong>Grade</strong></TableCell>
                    <TableCell align="center"><strong>Patterns Attempted</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(scores.areas).map(([areaName, areaData]) => (
                    <TableRow key={areaName}>
                      <TableCell>{areaName}</TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">
                          {formatPercentScore(areaData?.scores?.raw_score)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getScoreGrade(areaData?.scores?.raw_score)}
                          size="small"
                          color={areaData?.scores?.raw_score >= 80 ? 'success' : areaData?.scores?.raw_score >= 60 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {areaData?.scores?.attempted_pattern_count || 0} / {areaData?.scores?.pattern_count || 0}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={areaData?.scores?.raw_score >= 80 ? 'Excellent' : areaData?.scores?.raw_score >= 60 ? 'Good' : 'Needs Work'}
                          size="small"
                          color={areaData?.scores?.raw_score >= 80 ? 'success' : areaData?.scores?.raw_score >= 60 ? 'warning' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Detailed Category Breakdown */}
            <Box sx={{ mt: 3 }}>
              {Object.entries(scores.areas).map(([areaName, areaData]) => {
                if (areaData?.categories && Object.keys(areaData.categories).length > 0) {
                  return (
                    <Box key={areaName} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        {areaName} - Category Details
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                              <TableCell>Category</TableCell>
                              <TableCell align="center">Score</TableCell>
                              <TableCell align="center">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(areaData.categories).map(([catName, catData]) => (
                              <TableRow key={catName}>
                                <TableCell>{catName}</TableCell>
                                <TableCell align="center">
                                  {formatPercentScore(catData?.scores?.score)}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={catData?.scores?.score >= 80 ? 'Excellent' : catData?.scores?.score >= 60 ? 'Good' : 'Needs Work'}
                                    size="small"
                                    color={catData?.scores?.score >= 80 ? 'success' : catData?.scores?.score >= 60 ? 'warning' : 'error'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                }
                return null;
              })}
            </Box>
          </Box>
        )}

        {/* Activity Timeline */}
        {highlights?.activities && highlights.activities.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Activity Timeline ({highlights.activities.length} activities)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>Activity Type</strong></TableCell>
                    <TableCell align="center"><strong>Start Frame</strong></TableCell>
                    <TableCell align="center"><strong>End Frame</strong></TableCell>
                    <TableCell align="center"><strong>Duration (s)</strong></TableCell>
                    <TableCell align="center"><strong>Score</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {highlights.activities.map((activity, index) => {
                    const matchingScore = scores?.activity_timeline?.activities?.find(
                      (score) =>
                        score?.type === activity?.type &&
                        score?.frames?.start === activity?.frames?.start
                    );
                    const duration = ((activity?.frames?.end - activity?.frames?.start) / 30).toFixed(2);

                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{activity?.type || 'N/A'}</TableCell>
                        <TableCell align="center">{activity?.frames?.start || 0}</TableCell>
                        <TableCell align="center">{activity?.frames?.end || 0}</TableCell>
                        <TableCell align="center">{duration}s</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={matchingScore?.raw_score?.toFixed(2) || 'N/A'}
                            size="small"
                            color={matchingScore?.raw_score >= 80 ? 'success' : matchingScore?.raw_score >= 60 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Technical Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Technical Information
          </Typography>
          <Paper sx={{ p: 2 }} variant="outlined">
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Model Detection Version:</Typography>
                <Typography variant="body1">{drill?.model_detection_version || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Analysis Script Version:</Typography>
                <Typography variant="body1">{drill?.analysis_version || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Scoring Metrics Version:</Typography>
                <Typography variant="body1">{drill?.scoring_metrics_version || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Footer */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Report Generated: {new Date().toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            AIM Football - Coach Portal
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

const DrillDetailModal = ({ open, onClose, playerId, drillId, playerName }) => {
  const [loading, setLoading] = useState(false);
  const [drill, setDrill] = useState(null);
  const [scores, setScores] = useState(null);
  const [highlights, setHighlights] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && playerId && drillId) {
      fetchDrillData();
      setActiveTab(0); // Reset to first tab when modal opens
    }
  }, [open, playerId, drillId]);

  const fetchDrillData = async () => {
    setLoading(true);
    try {
      const [drillResponse, scoresResponse, highlightsResponse] = await Promise.all([
        playerService.getDrillDetails(playerId, drillId),
        playerService.getDrillScores(playerId, drillId),
        playerService.getDrillHighlights(playerId, drillId),
      ]);

      setDrill(drillResponse.data);
      setScores(scoresResponse.data);
      setHighlights(highlightsResponse.data);
    } catch (error) {
      console.error('Error fetching drill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentScore = (score) => {
    return score !== null && score !== undefined ? `${Math.round(score)}%` : 'N/A';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {drill?.gameType || 'Drill Details'}
        </Typography>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mt: 2 }}>
          <Tab label="Drill Details" />
          <Tab label="Performance Report" />
        </Tabs>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* Tab 0: Drill Details */}
            {activeTab === 0 && (
              <Box>
            {/* Version Information */}
            {drill && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Model Detection version: <strong>{drill.model_detection_version || 'N/A'}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analysis Script version: <strong>{drill.analysis_version || 'N/A'}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Scoring Metrics version: <strong>{drill.scoring_metrics_version || 'N/A'}</strong>
                </Typography>
              </Box>
            )}

            {/* Total Drill Score */}
            {scores && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Total Drill Score
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {formatPercentScore(scores.total_score)}
                </Typography>
              </Paper>
            )}

            {/* Score Breakdown by Area */}
            {scores?.areas && Object.keys(scores.areas).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Performance by Area
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(scores.areas).map(([key, value]) => (
                    <Grid item xs={12} md={6} key={key}>
                      <DrillScoreItem title={key} data={value} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Uploaded Video */}
            {drill?.videoUrl && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Uploaded Video
                </Typography>
                <video controls style={{ width: '100%', borderRadius: '8px' }}>
                  <source src={drill.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </Box>
            )}

            {/* Highlights */}
            {highlights?.activities && highlights.activities.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Highlights ({highlights.activities.length})
                </Typography>
                <Grid container spacing={2}>
                  {highlights.activities.map((highlight, index) => {
                    const matchingScore = scores?.activity_timeline?.activities?.find(
                      (score) =>
                        score?.type === highlight?.type &&
                        score?.frames?.start === highlight?.frames?.start
                    );
                    const rawScore = typeof matchingScore?.raw_score === 'number'
                      ? matchingScore.raw_score.toFixed(2)
                      : 'N/A';

                    return (
                      <Grid item xs={12} md={6} key={index}>
                        <Paper sx={{ p: 2 }}>
                          <ClipPlayer
                            src={drill?.videoUrl}
                            startTime={Number(highlight?.frames?.start) / 30}
                            endTime={Number(highlight?.frames?.end) / 30}
                          />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {highlight?.type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Score: {rawScore}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {!drill && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No drill data available
                </Typography>
              </Box>
            )}
              </Box>
            )}

            {/* Tab 1: Performance Report */}
            {activeTab === 1 && (
              <Box>
                {drill && scores ? (
                  <DrillReportProfessional
                    drill={drill}
                    scores={scores}
                    highlights={highlights}
                    playerName={playerName}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No report data available
                    </Typography>
                  </Box>
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
};

export default DrillDetailModal;
