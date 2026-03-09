import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import MessageIcon from '@mui/icons-material/Message';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AppLayout from '../components/AppLayout';
import AnimatedStatCard from '../components/AnimatedStatCard';
import Breadcrumbs from '../components/Breadcrumbs';
import StaffInvitationsCard from '../components/StaffInvitationsCard';
import { selectActiveContext, selectPrimaryRole, selectIsClubContext } from '../store/authSlice';
import { getTeamsPath, getMessagesPath, getAnalyticsPath } from '../utils/navigation';

const Dashboard = () => {
  const navigate = useNavigate();
  const activeContext = useSelector(selectActiveContext);
  const primaryRole = useSelector(selectPrimaryRole);
  const isClubContext = useSelector(selectIsClubContext);

  const quickActions = [
    {
      title: 'Teams',
      description: 'View and manage your teams',
      icon: <GroupIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      action: () => navigate(getTeamsPath(activeContext, primaryRole)),
      enabled: true,
    },
    {
      title: 'Analytics',
      description: 'View team and player statistics',
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      action: () => navigate(getAnalyticsPath(activeContext)),
      enabled: false,
    },
    {
      title: 'Messages',
      description: 'Communicate with your team',
      icon: <MessageIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      action: () => navigate(getMessagesPath(activeContext)),
      enabled: true,
    },
    {
      title: 'Progress',
      description: 'Track player development',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      action: () => {},
      enabled: false,
    },
  ];

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4 }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            {isClubContext && activeContext?.clubName
              ? `${activeContext.clubName} - Coach Dashboard`
              : 'Coach Dashboard'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isClubContext && activeContext?.clubName
              ? `Welcome to ${activeContext.clubName}`
              : 'Welcome to the AIM Coach Portal'}
          </Typography>
        </Box>

        {/* Quick Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={action.enabled ? {
                  y: -8,
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  transition: { duration: 0.2 },
                } : {}}
                onClick={action.enabled ? action.action : undefined}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: action.enabled ? 1 : 0.6,
                  cursor: action.enabled ? 'pointer' : 'not-allowed',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': action.enabled ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    bgcolor: action.color,
                  } : {},
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box
                    component={motion.div}
                    whileHover={action.enabled ? { scale: 1.1, rotate: 5 } : {}}
                    sx={{
                      color: action.color,
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!action.enabled}
                    sx={{
                      backgroundColor: action.color,
                      '&:hover': {
                        backgroundColor: action.color,
                        filter: 'brightness(0.9)',
                      },
                    }}
                  >
                    {action.enabled ? 'Open' : 'Coming Soon'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Staff Invitations */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          sx={{ mb: 4 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StaffInvitationsCard />
            </Grid>
          </Grid>
        </Box>

        {/* Quick Start */}
        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          sx={{ p: 4, textAlign: 'center', bgcolor: 'secondary.main', color: 'black' }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            Quick Start
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            Get started by creating your first team and inviting players to join.
          </Typography>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variant="contained"
            size="large"
            startIcon={<GroupIcon />}
            onClick={() => navigate(getTeamsPath(activeContext, primaryRole))}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': {
                bgcolor: '#333',
              },
            }}
          >
            Go to Teams
          </Button>
        </Paper>
      </Container>
    </AppLayout>
  );
};

export default Dashboard;
