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
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Business,
  ExpandMore,
  AttachMoney,
  Lightbulb,
  PriorityHigh,
  VerifiedUser,
  Rocket,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import clubReportService from '../services/clubReportService';
import pdfExportUtil from '../utils/pdfExportUtil';

const ClubAIReport = ({ clubId, clubName = 'Club' }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReport();
  }, [clubId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const reportData = await clubReportService.generateClubReport(clubId);
      setReport(reportData);
    } catch (err) {
      setError(err.message || 'Failed to generate club report');
      console.error('Error loading club report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'GOOD':
        return 'success';
      case 'NEEDS_ATTENTION':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'info';
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || exporting) return;

    setExporting(true);
    try {
      await pdfExportUtil.exportClubReport(
        reportRef.current,
        clubName,
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
          Analyzing club-wide performance data...
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Aggregating data from all teams...
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
    clubInfo,
    reportPeriod,
    metadata,
    clubMetrics,
    teamRankings,
    topPerformers,
    risingStars,
    clubStrengths,
    clubConcerns,
    ageGroupAnalysis,
    recommendations,
    talentPipeline,
    investmentOpportunities,
    categoryPerformanceSummary,
    highLevelTotals,
  } = report;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Club Performance Dashboard
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {clubInfo.name} • {reportPeriod.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generated {new Date(metadata.generatedAt).toLocaleDateString()} •
              Director: {clubInfo.director}
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

      {/* Club Overview Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'white', color: '#667eea', mr: 2, width: 64, height: 64 }}>
              <Business fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Club Overview
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {metadata.totalTeams} Teams • {metadata.totalPlayers} Players •{' '}
                {metadata.totalDrills} Drills This Month
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={700}>
                  {clubMetrics.overallScore.toFixed(1)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Club Average Score
                </Typography>
                <Chip
                  label={`+${clubMetrics.averageImprovement.toFixed(1)}% Growth`}
                  size="small"
                  sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  icon={<TrendingUp sx={{ color: 'white !important' }} />}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={700}>
                  {metadata.totalTeams}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Active Teams
                </Typography>
                <Chip
                  label={clubMetrics.clubHealth.status}
                  size="small"
                  sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={700}>
                  {metadata.totalPlayers}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Players
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={700}>
                  {metadata.totalDrills}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Drills Completed
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              {clubMetrics.clubHealth.description}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* High-Level Totals */}
      {highLevelTotals && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
              📊 Club-Wide Statistics
            </Typography>

            <Grid container spacing={3}>
              {/* Performance Level */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.50', height: '100%' }}>
                  <Typography variant="h3" color="primary" fontWeight={700}>
                    {highLevelTotals.clubPerformanceLevel}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    Club Performance Level
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {highLevelTotals.averageScores.overall.toFixed(1)} / 100
                  </Typography>
                  <Chip
                    label={`${highLevelTotals.totalImprovementRate >= 0 ? '+' : ''}${highLevelTotals.totalImprovementRate.toFixed(1)}% trend`}
                    size="small"
                    color={highLevelTotals.totalImprovementRate >= 0 ? 'success' : 'error'}
                    sx={{ mt: 1 }}
                    icon={highLevelTotals.totalImprovementRate >= 0 ? <TrendingUp /> : <TrendingDown />}
                  />
                </Paper>
              </Grid>

              {/* Drills by Type */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, bgcolor: 'success.50', height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Drills by Type
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Passing</Typography>
                      <Chip label={highLevelTotals.drillsByType.passing} size="small" color="primary" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Dribbling</Typography>
                      <Chip label={highLevelTotals.drillsByType.dribbling} size="small" color="primary" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">First Touch</Typography>
                      <Chip label={highLevelTotals.drillsByType.firstTouch} size="small" color="primary" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Technical</Typography>
                      <Chip label={highLevelTotals.drillsByType.technical} size="small" color="primary" />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight={600}>Total</Typography>
                      <Chip label={highLevelTotals.totalDrills} color="success" />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Activity Totals */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, bgcolor: 'warning.50', height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Activity Totals
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Passing</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {highLevelTotals.activityTotals.passingActivities.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Dribbling</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {highLevelTotals.activityTotals.dribblingActivities.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">First Touch</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {highLevelTotals.activityTotals.firstTouchActivities.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Technical</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {highLevelTotals.activityTotals.technicalActivities.toLocaleString()}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight={600}>Total</Typography>
                      <Typography variant="body1" fontWeight={700} color="warning.dark">
                        {highLevelTotals.activityTotals.totalActivities.toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Category Performance Summary */}
      {categoryPerformanceSummary && categoryPerformanceSummary.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              📈 Category Performance Across All Teams
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Club-wide averages for each category - strengths highlighted in green, areas needing improvement in red
            </Typography>
            <Grid container spacing={3}>
              {categoryPerformanceSummary.map((cat, index) => {
                const isStrength = cat.averageScore >= 75;
                const isWeakness = cat.averageScore < 50;
                const color = isStrength ? 'success' : isWeakness ? 'error' : 'warning';

                return (
                  <Grid item xs={12} sm={6} md={6} key={index}>
                    <Paper
                      sx={{
                        p: 3,
                        border: '2px solid',
                        borderColor: isStrength ? 'success.main' : isWeakness ? 'error.main' : 'warning.light',
                        bgcolor: isStrength ? 'success.50' : isWeakness ? 'error.50' : 'grey.50',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {cat.category}
                        </Typography>
                        <Chip
                          label={`${Math.round(cat.averageScore)}%`}
                          size="medium"
                          color={color}
                          sx={{ fontWeight: 700, fontSize: '1rem' }}
                        />
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={cat.averageScore}
                        color={color}
                        sx={{ height: 10, borderRadius: 1, mb: 2 }}
                      />

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Teams Excelling
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {cat.teamsExcelling} / {cat.totalTeams}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Teams Struggling
                          </Typography>
                          <Typography variant="body1" fontWeight={600} color={cat.teamsStruggling > 0 ? 'error.main' : 'success.main'}>
                            {cat.teamsStruggling} / {cat.totalTeams}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Best Team
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {cat.bestTeam}
                          </Typography>
                          <Chip label={`${cat.bestScore.toFixed(1)}%`} size="small" color="success" sx={{ mt: 0.5 }} />
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary">
                            Needs Support
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {cat.worstTeam}
                          </Typography>
                          <Chip label={`${cat.worstScore.toFixed(1)}%`} size="small" color="error" sx={{ mt: 0.5 }} />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Team Rankings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="warning" />
            Team Rankings
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Rank</strong></TableCell>
                  <TableCell><strong>Team</strong></TableCell>
                  <TableCell align="center"><strong>Rating</strong></TableCell>
                  <TableCell align="right"><strong>Avg Score</strong></TableCell>
                  <TableCell align="right"><strong>Players</strong></TableCell>
                  <TableCell align="right"><strong>Growth</strong></TableCell>
                  <TableCell align="center"><strong>Health</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamRankings.map((team) => (
                  <TableRow
                    key={team.teamId}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/teams/${team.teamId}`)}
                  >
                    <TableCell>
                      <Typography variant="h6" fontWeight={700}>
                        #{team.rank}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {team.teamName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {team.ageGroup} • Coach {team.coach}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6">{team.rating}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={team.avgScore >= 75 ? 'success.main' : team.avgScore >= 60 ? 'primary' : 'text.secondary'}
                      >
                        {team.avgScore.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{team.playerCount}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {team.improvement > 0 ? (
                          <TrendingUp color="success" fontSize="small" />
                        ) : team.improvement < 0 ? (
                          <TrendingDown color="error" fontSize="small" />
                        ) : (
                          <TrendingFlat color="action" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={team.improvement > 0 ? 'success.main' : team.improvement < 0 ? 'error.main' : 'text.secondary'}
                        >
                          {team.improvement > 0 ? '+' : ''}{team.improvement.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={team.healthStatus.replace(/_/g, ' ')}
                        size="small"
                        color={
                          team.healthStatus === 'excellent' ? 'success' :
                          team.healthStatus === 'good' ? 'primary' :
                          team.healthStatus === 'needs_support' ? 'error' :
                          'warning'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Top Performers and Rising Stars */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Club-Wide Top Performers */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star color="warning" />
                Club-Wide Top Performers
              </Typography>
              <List>
                {topPerformers.map((performer) => (
                  <ListItem
                    key={performer.rank}
                    sx={{
                      bgcolor: performer.rank === 1 ? 'warning.100' : 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                      border: performer.rank === 1 ? '2px solid' : '1px solid',
                      borderColor: performer.rank === 1 ? 'warning.main' : 'divider',
                    }}
                  >
                    <ListItemIcon>
                      <Typography variant="h5" fontWeight={700}>
                        {performer.badge}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={600}>
                          {performer.name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            <strong>{performer.score.toFixed(1)}/100</strong> • {performer.teamName} ({performer.ageGroup})
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Rising Stars */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rocket color="success" />
                Rising Stars
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Players showing exceptional improvement rates
              </Typography>
              <List>
                {risingStars.map((star, index) => (
                  <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={600}>
                          {star.playerName}
                        </Typography>
                      }
                      secondary={
                        <>
                          {star.teamName} • {star.currentScore.toFixed(1)}/100<br />
                          <strong>+{star.improvementRate.toFixed(1)}% improvement</strong>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Club Strengths and Concerns */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Club Strengths */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} color="success.dark">
                📈 Club Strengths
              </Typography>
              {clubStrengths.length > 0 ? (
                <Stack spacing={2}>
                  {clubStrengths.map((strength, index) => (
                    <Paper key={index} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {strength.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {strength.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`Avg: ${strength.avgScore.toFixed(1)}`} size="small" color="success" />
                        <Chip label={`${strength.percentageExcelling}% Teams Excelling`} size="small" color="success" />
                        <Chip label={`Leader: ${strength.leadTeam}`} size="small" variant="outlined" />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Building strengths across the club...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Club Concerns */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'error.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} color="error.dark">
                ⚠️ Club-Wide Concerns
              </Typography>
              {clubConcerns.length > 0 ? (
                <Stack spacing={2}>
                  {clubConcerns.map((concern, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        border: '2px solid',
                        borderColor: concern.severity === 'HIGH' ? 'error.main' : 'warning.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {concern.category}
                        </Typography>
                        <Chip
                          label={concern.severity}
                          size="small"
                          color={getSeverityColor(concern.severity)}
                          icon={concern.severity === 'HIGH' ? <PriorityHigh /> : undefined}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {concern.description}
                      </Typography>
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.50', borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          💡 {concern.recommendation}
                        </Typography>
                      </Box>
                      {concern.affectedTeams && Array.isArray(concern.affectedTeams) && concern.affectedTeams.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            <strong>Affected teams:</strong>{' '}
                            {typeof concern.affectedTeams[0] === 'string'
                              ? concern.affectedTeams.join(', ')
                              : concern.affectedTeams.map(t => t.name).join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No significant concerns identified!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Age Group Analysis */}
      <Card sx={{ mb: 3, bgcolor: 'info.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            📊 Age Group Analysis
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(ageGroupAnalysis).map(([group, data]) => (
              <Grid item xs={12} sm={6} md={3} key={group}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {group}
                  </Typography>
                  <Typography variant="h4" color="primary" fontWeight={700} gutterBottom>
                    {data.avgScore.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {data.teamCount} team{data.teamCount > 1 ? 's' : ''} • {data.playerCount} players
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Growth: {data.avgImprovement > 0 ? '+' : ''}{data.avgImprovement.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(data.avgScore, 100)}
                      sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                      color={data.avgScore >= 70 ? 'success' : data.avgScore >= 55 ? 'primary' : 'warning'}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb color="primary" />
            Strategic Recommendations
          </Typography>

          {/* Strategic Initiatives */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" fontWeight={600}>
                Strategic Initiatives
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {recommendations.strategic.map((rec, index) => (
                  <ListItem key={index} sx={{ bgcolor: 'primary.50', mb: 1, borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {rec.title}
                      </Typography>
                      <Chip label={rec.priority} size="small" color={getSeverityColor(rec.priority)} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {rec.description}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Impact:</strong> {rec.expectedImpact}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Timeframe:</strong> {rec.timeframe}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Cost:</strong> {rec.cost}
                        </Typography>
                      </Grid>
                    </Grid>
                    {rec.actions && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" fontWeight={600}>Action Steps:</Typography>
                        <List dense>
                          {rec.actions.map((action, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemIcon sx={{ minWidth: 30 }}>
                                <CheckCircle fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={<Typography variant="caption">{action}</Typography>} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Resource Allocation */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" fontWeight={600}>
                Resource Allocation
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {recommendations.resourceAllocation.map((rec, index) => (
                  <ListItem key={index} sx={{ bgcolor: 'warning.50', mb: 1, borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {rec.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {rec.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {rec.teams && <Chip label={`Teams: ${rec.teams.join(', ')}`} size="small" />}
                      <Chip label={`Expected Impact: ${rec.expectedImpact}`} size="small" color="primary" />
                      <Chip label={`Cost: ${rec.cost}`} size="small" color="warning" />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Talent Development */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" fontWeight={600}>
                Talent Development
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {recommendations.talentDevelopment.map((rec, index) => (
                  <ListItem key={index} sx={{ bgcolor: 'success.50', mb: 1, borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {rec.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {rec.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Expected Impact: ${rec.expectedImpact}`} size="small" color="success" />
                      <Chip label={`Cost: ${rec.cost}`} size="small" />
                      {rec.participants && <Chip label={rec.participants} size="small" variant="outlined" />}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Talent Pipeline */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUser color="primary" />
            Talent Pipeline
          </Typography>
          <Grid container spacing={3}>
            {/* Ready for Advancement */}
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom color="success.dark">
                  🚀 Ready for Advancement
                </Typography>
                <List>
                  {talentPipeline.ready.map((player, index) => (
                    <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {player.playerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {player.currentTeam} • {player.score.toFixed(1)}/100
                      </Typography>
                      <Typography variant="caption" color="success.dark" fontWeight={600}>
                        {player.recommendation}
                      </Typography>
                    </ListItem>
                  ))}
                  {talentPipeline.ready.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No players ready for advancement yet
                    </Typography>
                  )}
                </List>
              </Box>
            </Grid>

            {/* Developing */}
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">
                  📚 Developing Talent
                </Typography>
                <List>
                  {talentPipeline.developing.slice(0, 5).map((player, index) => (
                    <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {player.playerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {player.currentTeam} • {player.score.toFixed(1)}/100
                      </Typography>
                      <Chip label={`Potential: ${player.potential}`} size="small" color="primary" sx={{ mt: 0.5 }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>

            {/* Emerging */}
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom color="warning.dark">
                  ⭐ Emerging Stars
                </Typography>
                <List>
                  {talentPipeline.emerging.map((player, index) => (
                    <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1, flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {player.playerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {player.currentTeam} • {player.currentScore.toFixed(1)}/100
                      </Typography>
                      <Chip label={`+${player.improvementRate.toFixed(1)}% improvement`} size="small" color="warning" sx={{ mt: 0.5 }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Investment Opportunities */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="success" />
            Investment Opportunities
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            High-ROI investments to maximize club performance
          </Typography>
          <Grid container spacing={2}>
            {investmentOpportunities.map((opportunity, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper sx={{ p: 2, height: '100%', border: '2px solid', borderColor: opportunity.expectedROI === 'High' ? 'success.main' : 'primary.main' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    {opportunity.title}
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight={700} gutterBottom>
                    {opportunity.cost}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {opportunity.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`ROI: ${opportunity.expectedROI}`} size="small" color={opportunity.expectedROI === 'High' ? 'success' : 'primary'} />
                    <Chip label={opportunity.paybackPeriod} size="small" variant="outlined" />
                  </Box>
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight={600}>
                      ✨ Expected Impact: {opportunity.expectedImpact}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
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

export default ClubAIReport;
