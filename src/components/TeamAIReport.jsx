import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Star,
  Warning,
  CheckCircle,
  EmojiEvents,
  School,
  FitnessCenter,
  Group,
  ArrowUpward,
  ArrowDownward,
  PriorityHigh,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import teamReportService from '../services/teamReportService';
import pdfExportUtil from '../utils/pdfExportUtil';

const TeamAIReport = ({ teamId, teamName = 'Team' }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReport();
  }, [teamId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const reportData = await teamReportService.generateTeamReport(teamId);
      setReport(reportData);
    } catch (err) {
      setError(err.message || 'Failed to generate team report');
      console.error('Error loading team report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp color="success" fontSize="small" />;
      case 'DECLINING':
        return <TrendingDown color="error" fontSize="small" />;
      default:
        return <TrendingFlat color="action" fontSize="small" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getDistributionColor = (category) => {
    const colors = {
      excellent: '#4caf50',
      good: '#8bc34a',
      developing: '#ff9800',
      needs_work: '#f44336',
    };
    return colors[category] || '#9e9e9e';
  };

  const handlePlayerClick = (playerId) => {
    // Navigate to player profile
    navigate(`/players/${playerId}`);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || exporting) return;

    setExporting(true);
    try {
      await pdfExportUtil.exportTeamReport(
        reportRef.current,
        teamName,
        {
          onProgress: (message) => console.log('PDF Export:', message),
        }
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Analyzing team performance data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
        <Button size="small" onClick={loadReport} sx={{ ml: 2 }}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!report) {
    return null;
  }

  const {
    teamInfo,
    reportPeriod,
    metadata,
    teamMetrics,
    skillDistribution,
    topPerformers,
    bottomPerformers,
    teamStrengths,
    teamWeaknesses,
    trends,
    recommendations,
  } = report;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Team Performance Report
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {teamInfo.name} • {reportPeriod.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generated {new Date(metadata.generatedAt).toLocaleDateString()} •
              Coach: {teamInfo.coach}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <Download />}
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </Box>
      </Box>

      {/* Report Content Wrapper with ref for PDF export */}
      <Box ref={reportRef}>

      {/* Executive Summary Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'white', color: '#667eea', mr: 2, width: 56, height: 56 }}>
              <Group />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Executive Summary
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {metadata.totalPlayers} Players • {teamMetrics.totalDrills} Drills Completed
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={700}>
                  {teamMetrics.overallScore.toFixed(1)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Team Average Score
                </Typography>
                <Chip
                  label={`+${teamMetrics.averageImprovement.toFixed(1)}% Improvement`}
                  size="small"
                  sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  icon={<TrendingUp sx={{ color: 'white !important' }} />}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                The team shows strong technical fundamentals with excellent ball control across
                the squad. {teamWeaknesses.length > 0 && teamWeaknesses[0].category} remains our
                primary development focus, with {teamWeaknesses[0]?.percentageStrugging}% of
                players below target performance.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="warning" />
            Top Performers
          </Typography>
          <Grid container spacing={2}>
            {topPerformers.map((performer) => (
              <Grid item xs={12} md={4} key={performer.playerId}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    border: performer.rank === 1 ? '2px solid' : '1px solid',
                    borderColor: performer.rank === 1 ? 'warning.main' : 'divider',
                  }}
                  onClick={() => handlePlayerClick(performer.playerId)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      #{performer.rank}
                    </Typography>
                    {performer.rank === 1 && <Star color="warning" />}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {performer.name}
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight={700} gutterBottom>
                    {performer.overallScore.toFixed(1)}/100
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    {performer.badges.map((badge) => (
                      <Chip
                        key={badge}
                        label={badge.replace(/_/g, ' ')}
                        size="small"
                        color="primary"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Strengths:</strong> {performer.topStrengths.join(', ')}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                    {performer.note}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Players Needing Support */}
      <Card sx={{ mb: 3, bgcolor: 'warning.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FitnessCenter color="warning" />
            Players Needing Support
          </Typography>
          <Grid container spacing={2}>
            {bottomPerformers.map((performer) => (
              <Grid item xs={12} md={4} key={performer.playerId}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => handlePlayerClick(performer.playerId)}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {performer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Score: {performer.overallScore.toFixed(1)}/100
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    <strong>Focus:</strong> {performer.focusAreas.join(', ')}
                  </Typography>
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight={600}>
                      💡 {performer.recommendation}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Skill Distribution */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            📈 Skill Distribution
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            How players are distributed across different skill levels
          </Typography>

          <Grid container spacing={3}>
            {Object.entries(skillDistribution).map(([skill, data]) => (
              <Grid item xs={12} md={6} key={skill}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {skill.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      Avg: {data.average.toFixed(1)}
                    </Typography>
                  </Box>

                  {/* Distribution Bar */}
                  <Box sx={{ display: 'flex', height: 40, borderRadius: 1, overflow: 'hidden', mb: 1 }}>
                    {Object.entries(data.distribution).map(([category, count]) => {
                      const percentage = (count / metadata.totalPlayers) * 100;
                      return percentage > 0 ? (
                        <Box
                          key={category}
                          sx={{
                            width: `${percentage}%`,
                            bgcolor: getDistributionColor(category),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                          }}
                        >
                          {count}
                        </Box>
                      ) : null;
                    })}
                  </Box>

                  {/* Legend */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`Excellent: ${data.distribution.excellent}`} size="small" sx={{ bgcolor: getDistributionColor('excellent'), color: 'white' }} />
                    <Chip label={`Good: ${data.distribution.good}`} size="small" sx={{ bgcolor: getDistributionColor('good'), color: 'white' }} />
                    <Chip label={`Developing: ${data.distribution.developing}`} size="small" sx={{ bgcolor: getDistributionColor('developing'), color: 'white' }} />
                    <Chip label={`Needs Work: ${data.distribution.needs_work}`} size="small" sx={{ bgcolor: getDistributionColor('needs_work'), color: 'white' }} />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Team Strengths and Weaknesses Side by Side */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Team Strengths */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} color="success.dark">
                🎯 Team Strengths
              </Typography>
              {teamStrengths.length > 0 ? (
                <Stack spacing={2}>
                  {teamStrengths.map((strength, index) => (
                    <Paper key={index} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {strength.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {strength.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip label={`Avg: ${strength.avgScore.toFixed(1)}`} size="small" color="success" />
                        <Chip label={`${strength.percentageExcelling}% Excelling`} size="small" color="success" />
                      </Box>
                      <Typography variant="caption" color="success.dark" fontWeight={600}>
                        💡 {strength.recommendation}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Team is developing strengths - continue training!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Team Weaknesses */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'error.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} color="error.dark">
                ⚠️ Team Weaknesses
              </Typography>
              {teamWeaknesses.length > 0 ? (
                <Stack spacing={2}>
                  {teamWeaknesses.map((weakness, index) => (
                    <Paper key={index} sx={{ p: 2, border: '2px solid', borderColor: weakness.priority === 'HIGH' ? 'error.main' : 'warning.main' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {weakness.category}
                        </Typography>
                        <Chip
                          label={weakness.priority}
                          size="small"
                          color={getPriorityColor(weakness.priority)}
                          icon={weakness.priority === 'HIGH' ? <PriorityHigh /> : undefined}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {weakness.description}
                      </Typography>
                      <Typography variant="caption" display="block" color="error.dark" gutterBottom>
                        <strong>Impact:</strong> {weakness.impact}
                      </Typography>
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.50', borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          🎯 Action: {weakness.action}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Current: {weakness.avgScore.toFixed(1)} → Target: {weakness.targetScore} (Gap: {weakness.gap.toFixed(1)} points)
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(weakness.avgScore / weakness.targetScore) * 100}
                          sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
                          color={weakness.priority === 'HIGH' ? 'error' : 'warning'}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No significant weaknesses identified!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Trends */}
      <Card sx={{ mb: 3, bgcolor: 'info.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            📊 Performance Trends
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(trends).map(([key, trend]) => (
              <Grid item xs={12} sm={6} md={2.4} key={key}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    {getTrendIcon(trend.trend)}
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight={700}>
                    {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {trend.trend}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {trends.overall.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Training Recommendations */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            🎓 Training Recommendations
          </Typography>

          {/* Immediate */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom color="error.main">
              IMMEDIATE (Next 2 Weeks)
            </Typography>
            <List>
              {recommendations.immediate.map((rec, index) => (
                <ListItem key={index} sx={{ bgcolor: 'error.50', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    <PriorityHigh color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={rec.title}
                    secondary={
                      <>
                        {rec.description}
                        <br />
                        <strong>Expected Impact:</strong> {rec.expectedImpact} • <strong>Timeframe:</strong> {rec.timeframe}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Medium Term */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom color="warning.main">
              MEDIUM TERM (Next Month)
            </Typography>
            <List>
              {recommendations.mediumTerm.map((rec, index) => (
                <ListItem key={index} sx={{ bgcolor: 'warning.50', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    <School color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={rec.title}
                    secondary={
                      <>
                        {rec.description}
                        <br />
                        <strong>Expected Impact:</strong> {rec.expectedImpact} • <strong>Timeframe:</strong> {rec.timeframe}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Individual Focus */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom color="info.main">
              INDIVIDUAL FOCUS
            </Typography>
            <List>
              {recommendations.individualFocus.map((rec, index) => (
                <ListItem key={index} sx={{ bgcolor: 'info.50', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    <FitnessCenter color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={rec.title}
                    secondary={
                      <>
                        {rec.description}
                        <br />
                        <strong>Expected Impact:</strong> {rec.expectedImpact} • <strong>Timeframe:</strong> {rec.timeframe}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* Metadata Footer */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
        Report generated on {new Date(metadata.generatedAt).toLocaleString()} using {metadata.generatedBy}
      </Typography>
      </Box>
      {/* End of Report Content Wrapper */}
    </Box>
  );
};

export default TeamAIReport;
