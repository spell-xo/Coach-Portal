import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AppLayout from '../components/AppLayout';
import challengeService from '../api/challengeService';
import showToast from '../utils/toast';

const MEDAL_EMOJIS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

const STATUS_COLORS = {
  pending: '#F59E0B',
  active: '#10B981',
  completed: '#6366F1',
  cancelled: '#6B7280',
};

const WeeklyChallenge = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 1 });

  useEffect(() => {
    loadWeeklyChallenge();
  }, []);

  useEffect(() => {
    if (challenge) {
      loadLeaderboard();
    }
  }, [challenge]);

  const loadWeeklyChallenge = async () => {
    try {
      setLoading(true);
      const response = await challengeService.getWeeklyChallenge();

      if (response.success) {
        setChallenge(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading weekly challenge:', err);
      setError(err.response?.data?.message || 'Failed to load weekly challenge');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async (page = 1) => {
    try {
      setLeaderboardLoading(true);
      const response = await challengeService.getWeeklyChallengeLeaderboard(
        challenge._id,
        page,
        100
      );

      if (response.success) {
        setLeaderboard(response.data.leaderboard || []);
        setPagination(response.data.pagination || { page: 1, limit: 100, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      showToast.error('Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleRefresh = () => {
    loadWeeklyChallenge();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'inherit';
  };

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </AppLayout>
    );
  }

  if (error || !challenge) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'No active weekly challenge found'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/challenges')}>
            Back to Challenges
          </Button>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/challenges')}>
            Back to Challenges
          </Button>
        </Box>

        {/* Challenge Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEventsIcon sx={{ fontSize: 32, color: '#F59E0B' }} />
              <Typography variant="h4" component="h1">
                Weekly Challenge
              </Typography>
            </Box>
            <Chip
              label={challenge.status}
              sx={{
                backgroundColor: STATUS_COLORS[challenge.status],
                color: 'white',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          </Box>

          <Typography variant="h5" gutterBottom>
            {challenge.title}
          </Typography>

          {challenge.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {challenge.description}
            </Typography>
          )}

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Start Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(challenge.startDate)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    End Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(challenge.endDate)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Participants
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {challenge.participants?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Drills
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {challenge.challengeDrills?.length || 1}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Button startIcon={<RefreshIcon />} onClick={handleRefresh} variant="outlined">
            Refresh
          </Button>
        </Paper>

        {/* Leaderboard */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">
              Leaderboard
            </Typography>
            {leaderboardLoading && <CircularProgress size={24} />}
          </Box>

          {leaderboard.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No participants yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Participants will appear here once they start completing drills
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="80px" align="center">
                      <strong>Rank</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Participant</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Drills Completed</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Progress</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Score</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry, index) => {
                    const rank = (pagination.page - 1) * pagination.limit + index + 1;
                    const medal = MEDAL_EMOJIS[rank];
                    const completionPercentage = entry.totalDrills > 0
                      ? Math.round((entry.drillsCompleted / entry.totalDrills) * 100)
                      : 0;

                    return (
                      <TableRow
                        key={entry.userId}
                        sx={{
                          backgroundColor: rank <= 3 ? 'rgba(255, 215, 0, 0.05)' : 'inherit',
                          '&:hover': {
                            backgroundColor: rank <= 3 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {medal && (
                              <Tooltip title={`${rank === 1 ? 'Gold' : rank === 2 ? 'Silver' : 'Bronze'} Medal`}>
                                <span style={{ fontSize: '24px' }}>{medal}</span>
                              </Tooltip>
                            )}
                            <Typography
                              variant="h6"
                              fontWeight={rank <= 3 ? 700 : 400}
                              sx={{ color: getRankColor(rank) }}
                            >
                              {rank}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={entry.profilePicture}>
                              {entry.name?.charAt(0) || '?'}
                            </Avatar>
                            <Typography variant="body1" fontWeight={rank <= 3 ? 600 : 400}>
                              {entry.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="body2">
                            {entry.drillsCompleted} / {entry.totalDrills}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {completionPercentage}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={completionPercentage}
                              sx={{
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: '#E5E7EB',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: completionPercentage === 100 ? '#10B981' : '#3B82F6',
                                },
                              }}
                            />
                          </Box>
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="h6" fontWeight={rank <= 3 ? 700 : 600}>
                            {entry.overallScore?.toFixed(1) || '0.0'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {leaderboard.length > 0 && pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
              <Button
                variant="outlined"
                disabled={pagination.page === 1 || leaderboardLoading}
                onClick={() => loadLeaderboard(pagination.page - 1)}
              >
                Previous
              </Button>
              <Typography variant="body2" color="text.secondary">
                Page {pagination.page} of {pagination.pages}
              </Typography>
              <Button
                variant="outlined"
                disabled={pagination.page === pagination.pages || leaderboardLoading}
                onClick={() => loadLeaderboard(pagination.page + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </AppLayout>
  );
};

export default WeeklyChallenge;
