import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  LinearProgress,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  Avatar,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BuildIcon from '@mui/icons-material/Build';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import drillReportService from '../services/drillReportService';
import pdfExportUtil from '../utils/pdfExportUtil';
import ratingsService from '../api/ratingsService';
import recommendationService from '../api/recommendationService';
import aimLogoFull from '../assets/images/aim-logo-full.svg';
import { initializePaginationHelper } from '../utils/paginationHelper';
import '../styles/reportPrint.css';

const DrillReportProfessional = ({ drill, scores, highlights, playerName, playerProfilePicture }) => {
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coachComment, setCoachComment] = useState('');
  const [systemRecommendations, setSystemRecommendations] = useState([]);

  useEffect(() => {
    loadAIReport();
    loadCoachComment();
    loadSystemRecommendations();
  }, [drill, scores, highlights, playerName]);

  useEffect(() => {
    // Initialize pagination helper for smart page breaks
    initializePaginationHelper();
  }, []);

  const loadAIReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await drillReportService.generateDrillReport(drill, scores, highlights, playerName);
      setAiReport(report);
    } catch (err) {
      console.error('Error loading AI report:', err);
      setError('Failed to generate AI insights. Showing basic report.');
    } finally {
      setLoading(false);
    }
  };

  const loadCoachComment = async () => {
    try {
      if (!drill?._id && !drill?.drillId) return;

      const drillId = drill._id || drill.drillId;
      const response = await ratingsService.getDrillRating(drillId);

      if (response.success && response.data) {
        setCoachComment(response.data.comments || '');
      }
    } catch (err) {
      // Silently fail if no comment exists (404 is expected if coach hasn't commented yet)
      console.log('No coach comment found for this drill');
    }
  };

  const loadSystemRecommendations = async () => {
    try {
      if (!drill?._id && !drill?.drillId) return;

      const drillId = drill._id || drill.drillId;
      const response = await recommendationService.getDrillRecommendations(drillId);

      if (response.success && response.data) {
        setSystemRecommendations(response.data);
      }
    } catch (err) {
      // Silently fail if no recommendations exist
      console.log('No system recommendations found for this drill');
    }
  };

  const formatPercentScore = (score) => {
    return score !== null && score !== undefined ? Math.round(score) : 0;
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString() : 'N/A';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return 'success';
      case 'attention': return 'warning';
      case 'developmental': return 'info';
      default: return 'default';
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current || exporting) return;

    setExporting(true);
    try {
      // Generate filename as per PRD: <PlayerName>_<Drill>_<YYYY-MM-DD>.pdf
      const sanitizedPlayerName = playerName.replace(/[^a-z0-9]/gi, '_');
      const drillType = drill?.gameType || 'Drill';
      const date = new Date().toISOString().split('T')[0];
      const filename = `${sanitizedPlayerName}_${drillType}_${date}.pdf`;

      await pdfExportUtil.exportElementToPDF(reportRef.current, {
        filename,
        orientation: 'portrait',
        quality: 2,
        onProgress: (message) => console.log('PDF Export:', message),
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Extract insights and deduplicate technique breakdown (must be before early returns)
  const insights = aiReport?.aiInsights;

  // Deduplicate technique analysis breakdown to prevent duplicate technique ratings
  const deduplicatedTechniqueBreakdown = useMemo(() => {
    if (!insights?.techniqueAnalysis?.breakdown) return [];

    // Use a Map to keep only the last occurrence of each technique aspect
    const uniqueMap = new Map();
    insights.techniqueAnalysis.breakdown.forEach(item => {
      uniqueMap.set(item.aspect, item);
    });

    return Array.from(uniqueMap.values());
  }, [insights?.techniqueAnalysis?.breakdown]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
          Generating AI-Powered Insights...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Analyzing drill performance and creating personalized recommendations
        </Typography>
      </Box>
    );
  }

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

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper ref={reportRef} sx={{ p: 4, bgcolor: '#f5f5f5' }} className="report-container">
        {/* Header with AIM Logo and Player Profile Picture */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, gap: 2 }}>
          <img
            src={aimLogoFull}
            alt="AIM Football"
            style={{ height: '60px', width: 'auto' }}
          />
          {playerProfilePicture && (
            <Avatar
              src={playerProfilePicture}
              alt={playerName}
              sx={{
                width: 60,
                height: 60,
                border: '2px solid',
                borderColor: 'primary.main'
              }}
            />
          )}
        </Box>

        {/* Drill Report Title */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Drill Performance Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Player: <strong>{playerName}</strong> | Drill: <strong>{drill?.gameType}</strong> | Date: <strong>{formatDate(drill?.uploadDate)}</strong>
          </Typography>
        </Box>

        {/* Executive Summary */}
        <Paper
          className="section-block executive-summary"
          elevation={0}
          sx={{
            bgcolor: 'primary.50',
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
            p: 4,
            mb: 4,
            pageBreakInside: 'avoid'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                bgcolor: 'primary.main',
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              <StarIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Executive Summary
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, color: 'text.primary' }}>
            {insights?.executiveSummary}
          </Typography>
          <Typography variant="h2" fontWeight="bold" color="primary.main">
            {formatPercentScore(insights?.overallRating || scores?.total_score)}
            <Typography component="span" variant="h5" sx={{ ml: 1, color: 'text.secondary' }}>
              / 100 Overall Rating
            </Typography>
          </Typography>
        </Paper>

        {/* Performance Scores Section */}
        <Box className="section-block performance-scores" sx={{ mb: 4, pageBreakInside: 'avoid' }}>
          <Divider sx={{ mb: 3 }}>
            <Chip label="PERFORMANCE SCORES" className="section-title" sx={{ bgcolor: '#1e3a8a', color: 'white', fontWeight: 'bold', px: 2 }} />
          </Divider>
          <Grid container spacing={2} className="metric-grid">
          {Object.entries(scores?.areas || {}).map(([areaName, areaData]) => {
            const score = formatPercentScore(areaData?.scores?.raw_score);
            const color = getScoreColor(score);

            return (
              <Grid item xs={12} sm={6} md={4} key={areaName}>
                <Paper className="score-tile metric-tile" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {areaName}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {score}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: color
                      }
                    }}
                  />
                </Paper>
              </Grid>
            );
          })}
          </Grid>
        </Box>

        {/* Key Takeaways */}
        {insights?.keyTakeaways && insights.keyTakeaways.length > 0 && (
          <Box className="section-block key-takeaways" sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="KEY TAKEAWAYS" className="section-title" sx={{ bgcolor: '#ff9800', color: 'white', fontWeight: 'bold', px: 2 }} />
            </Divider>
            <Paper sx={{ p: 3, bgcolor: '#fff9e6', border: '1px solid #ffe0b2' }}>
              {insights.keyTakeaways.map((takeaway, index) => (
                <Typography key={index} variant="body1" sx={{ mb: 1.5 }}>
                  {takeaway}
                </Typography>
              ))}
            </Paper>
          </Box>
        )}

        {/* Strengths Analysis */}
        {insights?.strengthsAnalysis && insights.strengthsAnalysis.length > 0 && (
          <Box sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="STRENGTHS ANALYSIS" sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold', px: 2 }} />
            </Divider>
            {insights.strengthsAnalysis.map((strength, index) => (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  mb: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {strength.category}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={strength.level}
                      sx={{
                        bgcolor: '#e8f5e9',
                        color: '#2e7d32',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}
                    />
                    <Chip
                      label={strength.score}
                      sx={{
                        bgcolor: '#4caf50',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        height: 36,
                        borderRadius: 2
                      }}
                    />
                  </Box>
                </Box>

                <Typography variant="body1" color="text.primary" paragraph>
                  {strength.analysis}
                </Typography>

                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Evidence:
                  </Typography>
                  {strength.evidence.map((ev, idx) => (
                    <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      • {ev}
                    </Typography>
                  ))}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  <strong>Coach Recommendation:</strong> {strength.recommendation}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Areas for Improvement */}
        {insights?.improvementAnalysis && insights.improvementAnalysis.length > 0 && (
          <Box className="section-block areas-for-development" sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="AREAS FOR DEVELOPMENT" className="section-title" sx={{ bgcolor: '#ff9800', color: 'white', fontWeight: 'bold', px: 2 }} />
            </Divider>
            {insights.improvementAnalysis.map((area, index) => (
              <Paper className="improvement-card" key={index} sx={{ p: 3, mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {area.category}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`Priority: ${area.priority}`}
                      color={area.priority === 'HIGH' ? 'error' : 'warning'}
                      size="small"
                    />
                    <Chip
                      label={`Current: ${area.currentScore}%`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`Target: ${area.targetScore}%`}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>

                <Typography variant="body1" paragraph>
                  {area.analysis}
                </Typography>

                <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Specific Issues:
                  </Typography>
                  {area.specificIssues.map((issue, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                      ⚠ {issue}
                    </Typography>
                  ))}
                </Box>

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Action Plan:
                </Typography>
                <List dense>
                  {area.actionPlan.map((step, idx) => (
                    <ListItem key={idx} sx={{ pl: 0 }}>
                      <ListItemText
                        primary={`${idx + 1}. ${step.step}`}
                        secondary={`${step.description} (${step.duration})`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ))}
          </Box>
        )}

        {/* Technique Analysis */}
        {insights?.techniqueAnalysis && (
          <Box className="section-block technique-analysis" sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="TECHNIQUE ANALYSIS" className="section-title" sx={{ bgcolor: '#2196f3', color: 'white', fontWeight: 'bold', px: 2 }} />
            </Divider>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Overall Technique Rating: {insights.techniqueAnalysis.overallTechniqueRating}%
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2} className="metric-grid">
                {deduplicatedTechniqueBreakdown.map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box className="technique-tile metric-tile" sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {item.aspect}
                        </Typography>
                        <Chip
                          label={item.focus}
                          size="small"
                          color={item.focus === 'Excellent' ? 'success' : item.focus === 'Maintain & Refine' ? 'primary' : 'warning'}
                        />
                      </Box>
                      <Typography variant="h6" sx={{ color: getScoreColor(item.score), mb: 1 }}>
                        {item.score}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.assessment}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        )}

        {/* Training Recommendations */}
        {insights?.trainingRecommendations && insights.trainingRecommendations.length > 0 && (
          <Box className="section-block training-plan" sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="PERSONALIZED TRAINING PLAN" className="section-title" sx={{ bgcolor: '#9c27b0', color: 'white', fontWeight: 'bold', px: 2 }} />
            </Divider>
            {insights.trainingRecommendations.map((rec, index) => (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  mb: 2,
                  border: `2px solid ${rec.priority === 'HIGH' ? '#f44336' : rec.priority === 'MEDIUM' ? '#ff9800' : '#2196f3'}`,
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {rec.title}
                  </Typography>
                  <Chip
                    label={`${rec.priority} Priority`}
                    color={rec.priority === 'HIGH' ? 'error' : rec.priority === 'MEDIUM' ? 'warning' : 'info'}
                  />
                </Box>

                <Typography variant="body1" paragraph>
                  {rec.description}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Frequency
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {rec.frequency}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {rec.duration}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Target Improvement:
                  </Typography>
                  <Typography variant="body2">
                    🎯 {rec.targetImprovement}
                  </Typography>
                </Box>

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Suggested Drills:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {rec.suggestedDrills.map((drill, idx) => (
                    <Chip key={idx} label={drill} variant="outlined" size="small" />
                  ))}
                </Box>

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Success Criteria:
                </Typography>
                {rec.measurementCriteria.map((criteria, idx) => (
                  <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    ✓ {criteria}
                  </Typography>
                ))}
              </Paper>
            ))}
          </Box>
        )}

        {/* System-Generated Training Recommendations */}
        {systemRecommendations && systemRecommendations.length > 0 && (
          <Box className="section-block system-recommendations" sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Divider sx={{ mb: 3 }}>
              <Chip
                label="TARGETED TRAINING EXERCISES"
                className="section-title"
                icon={<FitnessCenterIcon />}
                sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold', px: 2 }}
              />
            </Divider>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Based on your performance metrics, our system recommends these specific exercises:
            </Typography>
            <Grid container spacing={2}>
              {systemRecommendations.map((rec, index) => {
                const priorityLevel = rec.recommendationRule?.priority >= 8 ? 'HIGH' : rec.recommendationRule?.priority >= 5 ? 'MEDIUM' : 'LOW';
                const priorityColor = priorityLevel === 'HIGH' ? 'error' : priorityLevel === 'MEDIUM' ? 'warning' : 'success';

                return (
                  <Grid item xs={12} md={6} key={rec._id || index}>
                    <Paper
                      sx={{
                        p: 3,
                        height: '100%',
                        border: `2px solid`,
                        borderColor: `${priorityColor}.main`,
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Priority Badge */}
                      <Chip
                        label={`${priorityLevel} Priority`}
                        color={priorityColor}
                        size="small"
                        sx={{ position: 'absolute', top: 12, right: 12 }}
                      />

                      {/* Exercise Video Thumbnail */}
                      {rec.trainingExercise?.thumbnailUrl && (
                        <Box
                          component="img"
                          src={rec.trainingExercise.thumbnailUrl}
                          alt={rec.trainingExercise.name?.en}
                          sx={{
                            width: '100%',
                            height: 140,
                            objectFit: 'cover',
                            borderRadius: 1,
                            mb: 2,
                          }}
                        />
                      )}

                      {/* Exercise Name */}
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ pr: 10 }}>
                        {rec.trainingExercise?.name?.en || 'Training Exercise'}
                      </Typography>

                      {/* Exercise Details */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {rec.trainingExercise?.category && (
                          <Chip
                            label={rec.trainingExercise.category}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {rec.trainingExercise?.difficulty && (
                          <Chip
                            label={rec.trainingExercise.difficulty}
                            size="small"
                            color={
                              rec.trainingExercise.difficulty === 'BEGINNER' ? 'success' :
                              rec.trainingExercise.difficulty === 'INTERMEDIATE' ? 'warning' : 'error'
                            }
                          />
                        )}
                        {rec.trainingExercise?.duration && (
                          <Chip
                            label={`${rec.trainingExercise.duration} min`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      {/* Recommendation Message */}
                      {rec.recommendation?.title?.en && (
                        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            {rec.recommendation.title.en}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {rec.recommendation.message?.en}
                          </Typography>
                        </Box>
                      )}

                      {/* Action Plan */}
                      {rec.recommendation?.actionPlan?.en && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            ACTION PLAN:
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                            {rec.recommendation.actionPlan.en}
                          </Typography>
                        </Box>
                      )}

                      {/* Triggering Metrics */}
                      {rec.triggeringMetrics && rec.triggeringMetrics.length > 0 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            BASED ON:
                          </Typography>
                          {rec.triggeringMetrics.map((metric, idx) => (
                            <Typography key={idx} variant="caption" display="block" sx={{ mt: 0.5 }}>
                              • {metric.metric}: {metric.actualValue} (threshold: {metric.operator} {metric.threshold})
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Performance Insights */}
        {insights?.performanceInsights && insights.performanceInsights.length > 0 && (
          <Box className="section-block performance-insights" sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="PERFORMANCE INSIGHTS" className="section-title" sx={{ bgcolor: '#00bcd4', color: 'white', fontWeight: 'bold', px: 2 }} />
            </Divider>
            <Grid container spacing={2}>
              {insights.performanceInsights.map((insight, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Alert severity={getInsightColor(insight.type)} sx={{ height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {insight.title}
                    </Typography>
                    <Typography variant="body2">
                      {insight.description}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}


        {/* Coach Comment */}
        {coachComment && (
          <Box className="section-block coach-comments" data-optional sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="COACH COMMENT" className="section-title" sx={{ bgcolor: '#607d8b', color: 'white', fontWeight: 'bold', px: 2 }} />
            </Divider>
            <Paper
              sx={{
                p: 3,
                bgcolor: '#f5f5f5',
                border: '2px solid #607d8b',
                borderRadius: 2
              }}
            >
              <Typography variant="body1" className="comment-body" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {coachComment}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Footer */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Report Generated: {new Date().toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            © AIM Football - Professional Performance Analysis
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default DrillReportProfessional;
