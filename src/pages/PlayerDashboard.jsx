import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  TextField,
  MenuItem,
} from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import MailIcon from '@mui/icons-material/Mail';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SportsIcon from '@mui/icons-material/Sports';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChatIcon from '@mui/icons-material/Chat';
import playerService from '../api/playerService';
import challengeService from '../api/challengeService';
import AppLayout from '../components/AppLayout';
import LevelBadge from '../components/dashboard/LevelBadge';
import StatCard from '../components/dashboard/StatCard';
import DrillListItem from '../components/dashboard/DrillListItem';
import ActivityItem from '../components/dashboard/ActivityItem';
import PlayerAIReport from '../components/PlayerAIReport';
import ParentReport from '../components/ParentReport';
import AIAssistant from '../components/AIAssistant';
import CoachRatingsTab from '../components/CoachRatingsTab';
import { selectCurrentUser } from '../store/authSlice';
import { getComparator, stableSort, createSortHandler } from '../utils/tableSorting';

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Dashboard data
  const [playerLevel, setPlayerLevel] = useState(null);
  const [overallScore, setOverallScore] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [stats, setStats] = useState({
    messages: 0,
    invites: 0,
    activeChallenges: 0,
    friendsOnline: 0,
  });
  const [drills, setDrills] = useState([]);
  const [drillsHistory, setDrillsHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teams, setTeams] = useState([]);
  const [chats, setChats] = useState([]);

  // Drill history pagination
  const [drillsPage, setDrillsPage] = useState(0);
  const [drillsRowsPerPage, setDrillsRowsPerPage] = useState(10);
  const [totalDrillsHistory, setTotalDrillsHistory] = useState(0);
  const [drillTypeFilter, setDrillTypeFilter] = useState('');
  const [drillsOrder, setDrillsOrder] = useState('desc');
  const [drillsOrderBy, setDrillsOrderBy] = useState('date');

  // Chats pagination
  const [chatsPage, setChatsPage] = useState(0);
  const [chatsRowsPerPage, setChatsRowsPerPage] = useState(10);
  const [totalChats, setTotalChats] = useState(0);
  const [chatsOrder, setChatsOrder] = useState('desc');
  const [chatsOrderBy, setChatsOrderBy] = useState('createdAt');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      if (activeTab === 3) {
        loadDrillsHistory();
      } else if (activeTab === 4) {
        loadChats();
      }
    }
  }, [activeTab, drillsPage, drillsRowsPerPage, drillTypeFilter, chatsPage, chatsRowsPerPage, currentUser?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser?.id) {
        console.warn('No current user ID available');
        setLoading(false);
        return;
      }

      // Load all dashboard data using real APIs
      const [
        dashboardStatsResponse,
        currentLevelResponse,
        activityFeedResponse,
        teamsResponse,
        playerStatsResponse,
      ] = await Promise.all([
        playerService.getDashboardStats(),
        playerService.getCurrentLevelDrills(),
        playerService.getActivityFeed(10),
        playerService.getPlayerTeams(),
        playerService.getPlayerStats(currentUser.id).catch(err => {
          console.warn('Failed to load player stats:', err);
          return { success: false };
        }),
      ]);

      // Set dashboard stats
      if (dashboardStatsResponse.success) {
        setStats({
          messages: dashboardStatsResponse.data.messages || 0,
          invites: dashboardStatsResponse.data.invites || 0,
          activeChallenges: dashboardStatsResponse.data.activeChallenges || 0,
          teams: dashboardStatsResponse.data.teams || 0,
        });
      }

      // Set current level and drills
      if (currentLevelResponse.success) {
        const levelData = currentLevelResponse.data;
        setPlayerLevel(levelData.currentLevel || 0);
        setOverallScore(levelData.overallScore || 0);
        setDrills(levelData.drills || []);
      }

      // Set activity feed
      if (activityFeedResponse.success) {
        setActivities(activityFeedResponse.data || []);
      }

      // Set teams
      if (teamsResponse.success) {
        setTeams(teamsResponse.data || []);
      }

      // Set player stats (total drills, average score, rank, etc.)
      if (playerStatsResponse.success) {
        setPlayerStats(playerStatsResponse.data);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadDrillsHistory = async () => {
    if (!currentUser?.id) return;

    try {
      const filters = {
        limit: drillsRowsPerPage,
        offset: drillsPage * drillsRowsPerPage,
      };

      if (drillTypeFilter) {
        filters.drillType = drillTypeFilter;
      }

      const response = await playerService.getMyDrills(filters);

      if (response.success) {
        setDrillsHistory(response.data);
        setTotalDrillsHistory(response.meta?.total || response.data.length);
      }
    } catch (err) {
      console.error('Failed to load drills history:', err);
      setDrillsHistory([]);
    }
  };

  const loadChats = async () => {
    if (!currentUser?.id) return;

    try {
      const response = await playerService.getMyChats({
        limit: chatsRowsPerPage,
        offset: chatsPage * chatsRowsPerPage,
      });

      if (response.success) {
        setChats(response.data);
        setTotalChats(response.meta?.total || response.data.length);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
      setChats([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDrillUpload = (drillId) => {
    // TODO: Navigate to drill upload page
    console.log('Upload drill:', drillId);
    navigate('/player/drills');
  };

  const handleDrillView = (drillId) => {
    // TODO: Navigate to drill detail page
    console.log('View drill:', drillId);
  };

  const handleDrillClick = (drillId) => {
    navigate(`/players/${currentUser.id}/drills/${drillId}`, {
      state: { playerName: currentUser.name }
    });
  };

  const handleDrillsPageChange = (event, newPage) => {
    setDrillsPage(newPage);
  };

  const handleDrillsRowsPerPageChange = (event) => {
    setDrillsRowsPerPage(parseInt(event.target.value, 10));
    setDrillsPage(0);
  };

  const handleDrillTypeFilterChange = (event) => {
    setDrillTypeFilter(event.target.value);
    setDrillsPage(0);
  };

  const handleResetFilters = () => {
    setDrillTypeFilter('');
    setDrillsPage(0);
  };

  const handleChatsPageChange = (event, newPage) => {
    setChatsPage(newPage);
  };

  const handleChatsRowsPerPageChange = (event) => {
    setChatsRowsPerPage(parseInt(event.target.value, 10));
    setChatsPage(0);
  };

  const handleDrillsRequestSort = createSortHandler(drillsOrderBy, drillsOrder, setDrillsOrderBy, setDrillsOrder, setDrillsPage);
  const handleChatsRequestSort = createSortHandler(chatsOrderBy, chatsOrder, setChatsOrderBy, setChatsOrder, setChatsPage);

  // Sort drills
  const sortedDrillsHistory = React.useMemo(() => {
    const numericFields = ['overallScore'];
    const isNumeric = numericFields.includes(drillsOrderBy);
    return stableSort(drillsHistory, getComparator(drillsOrder, drillsOrderBy, isNumeric));
  }, [drillsHistory, drillsOrder, drillsOrderBy]);

  // Sort chats
  const sortedChats = React.useMemo(() => {
    return stableSort(chats, getComparator(chatsOrder, chatsOrderBy));
  }, [chats, chatsOrder, chatsOrderBy]);

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </AppLayout>
    );
  }

  const isNewPlayer = playerLevel === 0 || playerLevel === null;
  const drillsCompleted = drills.filter(d => d.status === 'completed').length;
  const totalDrills = drills.length;
  const progressPercentage = totalDrills > 0 ? Math.round((drillsCompleted / totalDrills) * 100) : 0;

  return (
    <AppLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Hero Section - Player Status */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
            border: '2px solid',
            borderColor: '#66bb6a',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(90deg, #2e7d32 0%, #43a047 50%, #66bb6a 100%)',
            },
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Player Avatar/Badge Section */}
            <Grid item>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Avatar
                  src={currentUser?.profilePicture}
                  sx={{
                    width: 100,
                    height: 100,
                    border: '4px solid',
                    borderColor: '#2e7d32',
                    fontSize: '2.5rem',
                    fontWeight: 600,
                    bgcolor: 'white',
                    color: '#2e7d32',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  }}
                >
                  {currentUser?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Chip
                  label={`Level ${playerLevel || 0}`}
                  size="small"
                  sx={{
                    bgcolor: '#2e7d32',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                  }}
                />
              </Box>
            </Grid>

            {/* Player Info Section */}
            <Grid item xs>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    color: '#1b5e20',
                    mb: 0.5,
                  }}
                >
                  {isNewPlayer
                    ? `Welcome to AIM, ${currentUser?.name}!`
                    : `Welcome back, ${currentUser?.name}!`}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#2e7d32',
                    fontWeight: 500,
                  }}
                >
                  {isNewPlayer
                    ? 'Start your football training journey with AI-powered performance analysis'
                    : 'Continue improving your skills with personalized training'}
                </Typography>
              </Box>

              {isNewPlayer ? (
                <>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'white',
                      border: '2px solid #66bb6a',
                      borderRadius: 2,
                      mb: 2,
                      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#1b5e20', fontWeight: 700, mb: 0.5, fontSize: '0.95rem' }}>
                      ⚽ Get Started
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#2e7d32', lineHeight: 1.6 }}>
                      Complete {totalDrills} drills to unlock Level 1 and earn your first achievement badge
                    </Typography>
                  </Paper>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<RocketLaunchIcon />}
                    sx={{
                      bgcolor: '#2e7d32',
                      color: 'white',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                      '&:hover': {
                        bgcolor: '#1b5e20',
                        boxShadow: '0 6px 16px rgba(46, 125, 50, 0.4)',
                      },
                    }}
                    onClick={() => setActiveTab(0)}
                  >
                    View Level 1 Requirements
                  </Button>
                </>
              ) : (
                <>
                  {/* Stats Grid */}
                  <Grid container spacing={3} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: '#66bb6a',
                          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Current Level
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1b5e20', mt: 0.5 }}>
                          Level {playerLevel}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: '#66bb6a',
                          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Overall Score
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1b5e20', mt: 0.5 }}>
                          {overallScore?.toFixed(1) || 'N/A'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: '#66bb6a',
                          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Drills Completed
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1b5e20', mt: 0.5 }}>
                          {drillsCompleted}/{totalDrills}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Progress Bar */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: 'white',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: '#66bb6a',
                      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                        Progress to Level {playerLevel + 1}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1b5e20', fontSize: '1rem' }}>
                        {progressPercentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      sx={{
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: '#c8e6c9',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#2e7d32',
                          borderRadius: 2,
                          backgroundImage: 'linear-gradient(90deg, #2e7d32 0%, #43a047 100%)',
                        },
                      }}
                    />
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Quick Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<MessageIcon />}
              title="Messages"
              count={stats.messages}
              label="new"
              onClick={() => navigate('/messages')}
              color="#3B82F6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<MailIcon />}
              title="Invites"
              count={stats.invites}
              label="pending"
              onClick={() => navigate('/player/invitations')}
              color="#8B5CF6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<EmojiEventsIcon />}
              title="Challenges"
              count={stats.activeChallenges}
              label="active"
              onClick={() => navigate('/player/challenges')}
              color="#F59E0B"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<GroupIcon />}
              title="Teams"
              count={teams.length}
              label="joined"
              onClick={() => navigate('/player/teams')}
              color="#10B981"
            />
          </Grid>
        </Grid>

        {/* Main Content - Tabbed Sections */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label="My Drills" />
            <Tab label="AI Report" />
            <Tab label="Coach Ratings" />
            <Tab label="Drill History" />
            <Tab label="AI Chats" />
            <Tab label="Parent Report" />
            <Tab icon={<SmartToyIcon />} iconPosition="start" label="AI Assistant" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Tab 1: My Drills */}
            {activeTab === 0 && (
              <Box>
                {isNewPlayer ? (
                  <>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                        Level 1 Requirements
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Complete these {totalDrills} drills to earn your Level 1 badge
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <LevelBadge level={0} size="medium" />
                        <TrendingUpIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                        <LevelBadge level={1} size="medium" />
                      </Box>
                    </Box>

                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        💡 How it works:
                      </Typography>
                      <Typography variant="body2">
                        Upload a video for each drill. Our AI will analyze your performance and provide you with a score.
                        Complete all drills to unlock your Level 1 badge!
                      </Typography>
                    </Alert>
                  </>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        Level {playerLevel} Drills ({drillsCompleted}/{totalDrills})
                      </Typography>
                      <Button
                        variant="outlined"
                        endIcon={<TrendingUpIcon />}
                        onClick={() => console.log('Attempt next level')}
                      >
                        Attempt Next Level
                      </Button>
                    </Box>
                  </>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {drills.map((drill) => (
                    <DrillListItem
                      key={drill.id}
                      drillName={drill.name}
                      level={drill.level}
                      status={drill.status}
                      score={drill.score}
                      onView={() => handleDrillView(drill.id)}
                      onStart={() => handleDrillUpload(drill.id)}
                      required={drill.required}
                      progress={drill.progress}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Tab 1: AI Report */}
            {activeTab === 1 && currentUser?.id && (
              <Box>
                <PlayerAIReport playerId={currentUser.id} />
              </Box>
            )}

            {/* Tab 2: Coach Ratings */}
            {activeTab === 2 && currentUser?.id && (
              <Box>
                <CoachRatingsTab
                  entityId={currentUser.id}
                  entityType="player"
                  showPdfExport={false}
                />
              </Box>
            )}

            {/* Tab 3: Drill History */}
            {activeTab === 3 && (
              <Box>
                {/* Filters */}
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    select
                    label="Drill Type"
                    value={drillTypeFilter}
                    onChange={handleDrillTypeFilterChange}
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="JUGGLING">Juggling</MenuItem>
                    <MenuItem value="DRIBBLING">Dribbling</MenuItem>
                    <MenuItem value="PASSING">Passing</MenuItem>
                    <MenuItem value="SHOOTING">Shooting</MenuItem>
                  </TextField>

                  {drillTypeFilter && (
                    <Button
                      variant="outlined"
                      onClick={handleResetFilters}
                      size="small"
                    >
                      Reset Filters
                    </Button>
                  )}
                </Box>

                {drillsHistory.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SportsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {drillTypeFilter ? 'No drills found matching filters' : 'No drills completed yet'}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <TableSortLabel
                                active={drillsOrderBy === 'date'}
                                direction={drillsOrderBy === 'date' ? drillsOrder : 'asc'}
                                onClick={() => handleDrillsRequestSort('date')}
                              >
                                Date
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={drillsOrderBy === 'drillType'}
                                direction={drillsOrderBy === 'drillType' ? drillsOrder : 'asc'}
                                onClick={() => handleDrillsRequestSort('drillType')}
                              >
                                Drill Type
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={drillsOrderBy === 'overallScore'}
                                direction={drillsOrderBy === 'overallScore' ? drillsOrder : 'asc'}
                                onClick={() => handleDrillsRequestSort('overallScore')}
                              >
                                Overall Score
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={drillsOrderBy === 'status'}
                                direction={drillsOrderBy === 'status' ? drillsOrder : 'asc'}
                                onClick={() => handleDrillsRequestSort('status')}
                              >
                                Status
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedDrillsHistory.map((drill) => (
                            <TableRow
                              key={drill.drillId}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => handleDrillClick(drill.drillId)}
                            >
                              <TableCell>
                                {new Date(drill.date).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Chip label={drill.drillType} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  fontWeight={500}
                                  color={drill.overallScore >= 70 ? 'success.main' : 'text.primary'}
                                >
                                  {drill.overallScore?.toFixed(1) || '0.0'}%
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={drill.status}
                                  size="small"
                                  color={drill.status === 'completed' ? 'success' : drill.status === 'failed' ? 'error' : 'default'}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDrillClick(drill.drillId);
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={totalDrillsHistory}
                      rowsPerPage={drillsRowsPerPage}
                      page={drillsPage}
                      onPageChange={handleDrillsPageChange}
                      onRowsPerPageChange={handleDrillsRowsPerPageChange}
                    />
                  </>
                )}
              </Box>
            )}

            {/* Tab 4: AI Chats */}
            {activeTab === 4 && (
              <Box>
                {chats.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <ChatIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No AI chat history yet
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Topic</TableCell>
                            <TableCell>Messages</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedChats.map((chat) => (
                            <TableRow key={chat._id} hover>
                              <TableCell>
                                {new Date(chat.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>{chat.topic || 'General'}</TableCell>
                              <TableCell>{chat.messageCount || 0}</TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => console.log('View chat:', chat._id)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={totalChats}
                      rowsPerPage={chatsRowsPerPage}
                      page={chatsPage}
                      onPageChange={handleChatsPageChange}
                      onRowsPerPageChange={handleChatsRowsPerPageChange}
                    />
                  </>
                )}
              </Box>
            )}

            {/* Tab 5: Parent Report */}
            {activeTab === 5 && currentUser?.id && (
              <Box>
                <ParentReport playerId={currentUser.id} />
              </Box>
            )}

            {/* Tab 6: AI Assistant */}
            {activeTab === 6 && currentUser?.id && (
              <Box>
                <AIAssistant playerId={currentUser.id} />
              </Box>
            )}
          </Box>
        </Paper>

        {/* Right Sidebar - Teams (Desktop only) */}
        {teams.length > 0 && (
          <Paper sx={{ p: 3, display: { xs: 'none', lg: 'block' } }}>
            <Typography variant="h6" gutterBottom>
              My Teams
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {teams.slice(0, 3).map((team) => (
                <Box
                  key={team._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => navigate('/player/teams')}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {team.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {team.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {team.ageGroup}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            {teams.length > 3 && (
              <Button
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                onClick={() => navigate('/player/teams')}
              >
                View All Teams
              </Button>
            )}
          </Paper>
        )}
      </Container>
    </AppLayout>
  );
};

export default PlayerDashboard;
