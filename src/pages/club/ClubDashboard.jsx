import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { motion } from 'framer-motion';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SportsIcon from '@mui/icons-material/Sports';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import WebIcon from '@mui/icons-material/Web';
import AppLayout from '../../components/AppLayout';
import AnimatedStatCard from '../../components/AnimatedStatCard';
import Breadcrumbs from '../../components/Breadcrumbs';
import { SkeletonStatCard } from '../../components/skeletons';
import RequireRole from '../../components/RequireRole';
import StaffInvitationsCard from '../../components/StaffInvitationsCard';
import ClubAIReport from '../../components/ClubAIReport';
import { selectActiveContext } from '../../store/authSlice';
import clubService from '../../api/clubService';

const ClubDashboard = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const activeContext = useSelector(selectActiveContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [clubId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await clubService.getDashboard(clubId);

      // Transform API response to match component expectations
      const transformedData = {
        stats: {
          teamCount: response.data.stats?.teamCount || 0,
          coachCount: response.data.stats?.coachCount || 0,
          playerCount: response.data.stats?.playerCount || 0,
          activeTeams: response.data.stats?.activeTeams || 0,
          // Include drill statistics from API response
          drills: response.data.stats?.drills || {
            totalUploaded: 0,
            awaitingAnnotation: 0,
            readyForProcessing: 0,
            analysed: 0,
            uniqueUsers: 0,
            uploadedViaApp: 0,
            uploadedViaPortal: 0
          }
        },
        recentActivity: [
          // TODO: Implement activity feed in backend
          { id: 1, message: `Club has ${response.data.stats?.teamCount || 0} active teams`, time: 'Now' }
        ],
        teams: response.data.teams?.slice(0, 3).map(team => ({
          id: team._id,
          name: team.name,
          playerCount: team.playerCount || 0,
          status: team.status || 'Active'
        })) || []
      };

      setDashboardData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Breadcrumbs />
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              {activeContext?.clubName || 'Club Dashboard'}
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <SkeletonStatCard />
              </Grid>
            ))}
          </Grid>
        </Container>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        {/* Header */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {activeContext?.clubName || 'Club Dashboard'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome to your club management dashboard
            </Typography>
          </Box>

          {/* Quick Actions */}
          <RequireRole roles={['club_manager', 'head_coach']}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              sx={{ display: 'flex', gap: 1 }}
            >
              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/clubs/${clubId}/invitations`)}
              >
                Invite Player
              </Button>
              <RequireRole roles={['head_coach']}>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/clubs/${clubId}/teams/create`)}
                >
                  Create Team
                </Button>
              </RequireRole>
            </Box>
          </RequireRole>
        </Box>

        {/* Tabs Navigation - AI Report tab temporarily disabled */}
        {/* <Paper sx={{ mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Overview" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="AI Report" icon={<TrendingUpIcon />} iconPosition="start" />
          </Tabs>
        </Paper> */}

        {/* Tab Panel: Overview */}
        {activeTab === 0 && (
          <>
            {/* Consolidated Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Club Overview Card */}
              <Grid item xs={12} md={4}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  sx={{ p: 3, height: '100%' }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    Club Overview
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <GroupIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {dashboardData?.stats.teamCount || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Teams
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <SportsIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {dashboardData?.stats.coachCount || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Coaches
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <PersonIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {dashboardData?.stats.playerCount || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Players
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <TrendingUpIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {dashboardData?.stats.activeTeams || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Teams
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Drill Statistics Card */}
              <Grid item xs={12} md={4}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  sx={{ p: 3, height: '100%' }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    Drill Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <VideoLibraryIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {dashboardData?.stats.drills?.totalUploaded || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Drills
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <PendingActionsIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {dashboardData?.stats.drills?.awaitingAnnotation || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Awaiting Annotation
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <PlayCircleOutlineIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {dashboardData?.stats.drills?.readyForProcessing || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ready for Processing
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {dashboardData?.stats.drills?.analysed || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Drills Analysed
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* User Activity Card */}
              <Grid item xs={12} md={4}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    User Activity
                  </Typography>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <PeopleAltIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {dashboardData?.stats.drills?.uniqueUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

        {/* Staff Invitations */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <StaffInvitationsCard />
          </Grid>
        </Grid>

        {/* Recent Activity & Teams */}
        <Grid container spacing={3}>
          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              sx={{ p: 3, height: '100%' }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <List>
                {dashboardData?.recentActivity.map((activity, index) => (
                  <ListItem
                    key={activity.id}
                    divider
                    component={motion.div}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <ListItemText
                      primary={activity.message}
                      secondary={activity.time}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Teams Overview */}
          <Grid item xs={12} md={6}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              sx={{ p: 3, height: '100%' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Teams
                </Typography>
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.05 }}
                  size="small"
                  onClick={() => navigate(`/clubs/${clubId}/teams`)}
                >
                  View All
                </Button>
              </Box>
              <List>
                {dashboardData?.teams.map((team, index) => (
                  <ListItem
                    key={team.id}
                    divider
                    button
                    component={motion.div}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.02)' }}
                    onClick={() => navigate(`/clubs/${clubId}/teams/${team.id}`)}
                    sx={{ cursor: 'pointer', borderRadius: 1 }}
                    secondaryAction={
                      <Chip
                        label={team.status}
                        color={team.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    }
                  >
                    <ListItemText
                      primary={team.name}
                      secondary={`${team.playerCount} players`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
          </>
        )}

        {/* Tab Panel: AI Report */}
        {activeTab === 1 && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ClubAIReport clubId={clubId} clubName={activeContext?.clubName} />
          </Box>
        )}
      </Container>
    </AppLayout>
  );
};

export default ClubDashboard;
