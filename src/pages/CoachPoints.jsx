import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Leaderboard as LeaderboardIcon,
  Category as CategoryIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import AppLayout from '../components/AppLayout';
import coachPointsService from '../api/coachPointsService';
import PointsSummaryHeader from '../components/coach-points/PointsSummaryHeader';
import StreakTracker from '../components/coach-points/StreakTracker';
import MilestonesTimeline from '../components/coach-points/MilestonesTimeline';
import LeaderboardCard from '../components/coach-points/LeaderboardCard';

const CATEGORY_COLORS = {
  PORTAL_ENGAGEMENT: '#4CAF50',
  PLAYER_MANAGEMENT: '#2196F3',
  MISSIONS_ASSIGNMENTS: '#9C27B0',
  FEEDBACK_COMMUNICATION: '#FF9800',
  PERFORMANCE_ANALYSIS: '#00BCD4',
  CHALLENGES: '#E91E63',
  TRAINING_EXERCISES: '#795548',
  COACH_DEVELOPMENT: '#607D8B',
  CONSISTENCY_RETENTION: '#3F51B5',
  QUALITY_BONUS: '#FFC107',
};

const CATEGORY_LABELS = {
  PORTAL_ENGAGEMENT: 'Portal Engagement',
  PLAYER_MANAGEMENT: 'Player Management',
  MISSIONS_ASSIGNMENTS: 'Missions & Assignments',
  FEEDBACK_COMMUNICATION: 'Feedback & Communication',
  PERFORMANCE_ANALYSIS: 'Performance Analysis',
  CHALLENGES: 'Challenges',
  TRAINING_EXERCISES: 'Training Exercises',
  COACH_DEVELOPMENT: 'Coach Development',
  CONSISTENCY_RETENTION: 'Consistency & Retention',
  QUALITY_BONUS: 'Quality Bonus',
};

const CoachPoints = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Data states
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ total: 0, page: 1 });
  const [streaks, setStreaks] = useState([]);
  const [milestones, setMilestones] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Filters
  const [historyCategory, setHistoryCategory] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 1) {
      loadHistory();
    }
  }, [activeTab, historyPagination.page, historyCategory]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, streaksRes, milestonesRes, categoryRes, leaderboardRes] = await Promise.all([
        coachPointsService.getMyPointsSummary(),
        coachPointsService.getMyStreaks(),
        coachPointsService.getMyMilestones(),
        coachPointsService.getMyCategoryBreakdown(),
        coachPointsService.getClubLeaderboard(null, 10),
      ]);

      setSummary(summaryRes.data);
      setStreaks(streaksRes.data || []);
      setMilestones(milestonesRes.data);
      setCategoryBreakdown(categoryRes.data);
      setLeaderboard(leaderboardRes.data || []);
    } catch (err) {
      console.error('Error loading coach points:', err);
      setError(err.response?.data?.message || 'Failed to load coach points');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const params = {
        limit: 20,
        offset: (historyPagination.page - 1) * 20,
      };
      if (historyCategory) params.category = historyCategory;

      const res = await coachPointsService.getMyPointsHistory(params);
      setHistory(res.data || []);
      setHistoryPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
      }));
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const getCategoryChartData = () => {
    if (!categoryBreakdown) return [];
    return Object.entries(categoryBreakdown)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key] || key,
        value,
        color: CATEGORY_COLORS[key] || '#999',
      }));
  };

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Header */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ mb: 4 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" fontWeight="bold">
                Coach Points
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Track your engagement and earn rewards for coaching activities
            </Typography>
          </Box>

          {/* Points Summary Header */}
          {summary && <PointsSummaryHeader summary={summary} />}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab icon={<CategoryIcon />} label="Overview" iconPosition="start" />
              <Tab icon={<HistoryIcon />} label="History" iconPosition="start" />
              <Tab icon={<FireIcon />} label="Streaks" iconPosition="start" />
              <Tab icon={<StarIcon />} label="Milestones" iconPosition="start" />
              <Tab icon={<LeaderboardIcon />} label="Leaderboard" iconPosition="start" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Category Breakdown Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Points by Category
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCategoryChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {getCategoryChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} points`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    {/* Legend */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {getCategoryChartData().map((entry) => (
                        <Chip
                          key={entry.name}
                          size="small"
                          label={`${entry.name}: ${entry.value}`}
                          sx={{
                            backgroundColor: entry.color,
                            color: 'white',
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          This Month
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {summary?.totalPointsThisMonth || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          points earned
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          This Week
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="secondary">
                          {summary?.totalPointsThisWeek || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          points earned
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Login Streak
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FireIcon color="error" />
                          <Typography variant="h4" fontWeight="bold">
                            {summary?.currentLoginStreak || 0}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          days in a row
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Club Rank
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LeaderboardIcon color="primary" />
                          <Typography variant="h4" fontWeight="bold">
                            #{summary?.clubRank || '-'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          in your club
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Level Progress */}
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Level {summary?.level || 1}: {summary?.levelName || 'Rookie Coach'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {summary?.pointsToNextLevel || 0} pts to next level
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={summary?.pointsToNextLevel ? Math.min(100, ((summary.totalPoints % 1000) / (summary.pointsToNextLevel || 1)) * 100) : 0}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Activity Mini */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    {history.length === 0 ? (
                      <Typography color="text.secondary">No recent activity</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {history.slice(0, 5).map((tx) => (
                          <Box
                            key={tx._id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                            }}
                          >
                            <Box>
                              <Typography variant="body2">{tx.activityName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(tx.awardedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Chip
                              label={`+${tx.totalPoints}`}
                              size="small"
                              color="success"
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Points History</Typography>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Category</InputLabel>
                    <Select
                      value={historyCategory}
                      onChange={(e) => {
                        setHistoryCategory(e.target.value);
                        setHistoryPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      label="Filter by Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Activity</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Base</TableCell>
                        <TableCell align="right">Multiplier</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((tx) => (
                        <TableRow key={tx._id}>
                          <TableCell>
                            <Typography variant="body2">{tx.activityName}</Typography>
                            {tx.description && (
                              <Typography variant="caption" color="text.secondary">
                                {tx.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={CATEGORY_LABELS[tx.category] || tx.category}
                              sx={{
                                backgroundColor: CATEGORY_COLORS[tx.category] || '#999',
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">{tx.basePoints}</TableCell>
                          <TableCell align="right">
                            {tx.multiplier > 1 ? (
                              <Chip size="small" label={`x${tx.multiplier.toFixed(2)}`} color="warning" />
                            ) : (
                              'x1.00'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="success.main">
                              +{tx.totalPoints}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {new Date(tx.awardedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {historyPagination.total > 20 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={Math.ceil(historyPagination.total / 20)}
                      page={historyPagination.page}
                      onChange={(e, page) => setHistoryPagination(prev => ({ ...prev, page }))}
                      color="primary"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && <StreakTracker streaks={streaks} summary={summary} />}

          {activeTab === 3 && <MilestonesTimeline milestones={milestones} totalPoints={summary?.totalPoints || 0} />}

          {activeTab === 4 && <LeaderboardCard leaderboard={leaderboard} />}
        </Box>
      </Container>
    </AppLayout>
  );
};

export default CoachPoints;
