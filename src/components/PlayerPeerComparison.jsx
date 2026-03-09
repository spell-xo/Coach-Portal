import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  EmojiEvents,
  Star,
  ArrowUpward,
  ArrowDownward,
  Remove,
} from '@mui/icons-material';

const PlayerPeerComparison = ({ peerComparison }) => {
  if (!peerComparison) {
    return null;
  }

  const {
    teamContext,
    overallRanking,
    metricComparisons,
    strengthsVsTeam,
    opportunitiesVsTeam,
    improvementVsTeam,
    positionRanking,
  } = peerComparison;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'above':
        return <ArrowUpward fontSize="small" color="success" />;
      case 'below':
        return <ArrowDownward fontSize="small" color="error" />;
      default:
        return <Remove fontSize="small" color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'above':
        return 'success.main';
      case 'below':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          📊 Peer Comparison
        </Typography>
        <Typography variant="body2" color="text.secondary">
          How this player compares to teammates in {teamContext.teamName}
        </Typography>
      </Box>

      {/* Overall Ranking Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={700}>
                  #{overallRanking.rank}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  out of {overallRanking.totalPlayers} players
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                {overallRanking.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={`${overallRanking.percentile}th Percentile`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                />
                <Chip
                  label={`${overallRanking.vsTeamAverage > 0 ? '+' : ''}${overallRanking.vsTeamAverage.toFixed(1)} vs Team Avg`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                  icon={overallRanking.vsTeamAverage > 0 ? <TrendingUp sx={{ color: 'white !important' }} /> : <TrendingDown sx={{ color: 'white !important' }} />}
                />
              </Box>
              {positionRanking && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Position: {positionRanking.position} • Ranked #{positionRanking.rankInPosition} of {positionRanking.totalInPosition} {positionRanking.position.toLowerCase()}s
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Metric Comparison Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Performance vs Team Average
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Metric</strong></TableCell>
                  <TableCell align="right"><strong>Player</strong></TableCell>
                  <TableCell align="right"><strong>Team Avg</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Est. Rank</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metricComparisons.map((metric, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{metric.metric}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={getStatusColor(metric.status)}
                      >
                        {metric.playerScore.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {metric.teamAverage.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {getStatusIcon(metric.status)}
                        <Typography
                          variant="caption"
                          color={getStatusColor(metric.status)}
                          fontWeight={600}
                        >
                          {metric.difference > 0 ? '+' : ''}{metric.difference.toFixed(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {metric.ranking.description}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Strengths and Opportunities Side by Side */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Strengths vs Team */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} color="success.dark">
                🏆 Strengths vs Team
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Areas where this player excels compared to teammates
              </Typography>

              {strengthsVsTeam.length > 0 ? (
                <Stack spacing={2}>
                  {strengthsVsTeam.map((strength, index) => (
                    <Paper key={index} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {strength.category}
                        </Typography>
                        <Chip
                          label={strength.badge}
                          size="small"
                          color="success"
                          icon={<Star />}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Player: <strong>{strength.playerScore.toFixed(1)}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Team: {strength.teamAverage.toFixed(1)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="success.dark" fontWeight={600}>
                        +{strength.advantage} points above team average
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {strength.ranking.description}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Performance is similar to team average across all metrics
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Opportunities vs Team */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} color="warning.dark">
                💪 Growth Opportunities
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Areas to focus on to reach team average
              </Typography>

              {opportunitiesVsTeam.length > 0 ? (
                <Stack spacing={2}>
                  {opportunitiesVsTeam.map((opportunity, index) => (
                    <Paper key={index} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {opportunity.category}
                        </Typography>
                        <Chip
                          label={opportunity.priority}
                          size="small"
                          color={opportunity.priority === 'HIGH' ? 'error' : 'warning'}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Player: <strong>{opportunity.playerScore.toFixed(1)}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Team: {opportunity.teamAverage.toFixed(1)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="warning.dark" fontWeight={600}>
                        {opportunity.gap} points below team average
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {opportunity.ranking.description}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Performing at or above team average in all areas!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Improvement Rate Comparison */}
      <Card sx={{ bgcolor: 'info.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            📈 Improvement Rate
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h3">{improvementVsTeam.status.icon}</Typography>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {improvementVsTeam.status.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Player: +{improvementVsTeam.playerImprovement.toFixed(1)}% •
                    Team Avg: +{improvementVsTeam.teamAverageImprovement.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">Player Improvement</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    +{improvementVsTeam.playerImprovement.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(improvementVsTeam.playerImprovement * 10, 100)}
                  sx={{ height: 10, borderRadius: 5, mb: 2 }}
                  color={improvementVsTeam.status.status === 'faster' ? 'success' : 'primary'}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">Team Average</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    +{improvementVsTeam.teamAverageImprovement.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(improvementVsTeam.teamAverageImprovement * 10, 100)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PlayerPeerComparison;
