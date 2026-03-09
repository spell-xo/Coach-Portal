import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  LocalFireDepartment as FireIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

const STREAK_INFO = {
  LOGIN: {
    name: 'Login Streak',
    description: 'Log in every day to maintain your streak',
    icon: '🔑',
    color: '#FF5722',
  },
  ACTIVITY: {
    name: 'Activity Streak',
    description: 'Perform any point-earning activity daily',
    icon: '⚡',
    color: '#2196F3',
  },
  MISSION: {
    name: 'Mission Streak',
    description: 'Create missions consistently',
    icon: '🎯',
    color: '#9C27B0',
  },
  FEEDBACK: {
    name: 'Feedback Streak',
    description: 'Provide feedback to players regularly',
    icon: '💬',
    color: '#4CAF50',
  },
  DRILL_REVIEW: {
    name: 'Drill Review Streak',
    description: 'Review player drills consistently',
    icon: '📹',
    color: '#00BCD4',
  },
  COMMUNICATION: {
    name: 'Communication Streak',
    description: 'Stay in touch with players and guardians',
    icon: '📱',
    color: '#FF9800',
  },
};

const STREAK_MILESTONES = [
  { days: 7, name: 'Week Warrior', bonus: 50 },
  { days: 14, name: 'Fortnight Fighter', bonus: 100 },
  { days: 30, name: 'Monthly Marvel', bonus: 250 },
  { days: 60, name: 'Two Month Titan', bonus: 500 },
  { days: 90, name: 'Quarter Champion', bonus: 1000 },
];

const StreakCard = ({ streak, index }) => {
  const info = STREAK_INFO[streak.streakType] || {
    name: streak.streakType,
    description: '',
    icon: '🔥',
    color: '#999',
  };

  const nextMilestone = STREAK_MILESTONES.find(m => m.days > streak.currentStreak);
  const progress = nextMilestone
    ? (streak.currentStreak / nextMilestone.days) * 100
    : 100;

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      sx={{
        height: '100%',
        borderLeft: `4px solid ${info.color}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h3">{info.icon}</Typography>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{info.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {info.description}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              p: 1,
              borderRadius: 2,
              bgcolor: streak.isActive ? `${info.color}20` : 'action.disabledBackground',
            }}
          >
            <FireIcon sx={{ color: streak.isActive ? info.color : 'text.disabled' }} />
            <Typography
              variant="h4"
              fontWeight="bold"
              color={streak.isActive ? info.color : 'text.disabled'}
            >
              {streak.currentStreak}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Current Streak
            </Typography>
            {streak.isActive ? (
              <Chip
                size="small"
                icon={<CheckIcon />}
                label="Active"
                color="success"
                variant="outlined"
              />
            ) : (
              <Chip
                size="small"
                icon={<ScheduleIcon />}
                label="Inactive"
                color="default"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Progress to next milestone */}
        {nextMilestone && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Next: {nextMilestone.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {streak.currentStreak}/{nextMilestone.days} days
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: info.color,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              +{nextMilestone.bonus} bonus points
            </Typography>
          </Box>
        )}

        {/* Best streak */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Best Streak
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {streak.longestStreak} days
          </Typography>
        </Box>

        {/* Bonuses earned */}
        {streak.bonusThresholdsReached?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Bonuses Earned
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {streak.bonusThresholdsReached.map((bonus, i) => (
                <Chip
                  key={i}
                  size="small"
                  label={`${bonus.threshold}d`}
                  sx={{ bgcolor: info.color, color: 'white' }}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const StreakTracker = ({ streaks, summary }) => {
  // Add login streak from summary if not in streaks
  const allStreaks = [...streaks];
  if (summary && !streaks.find(s => s.streakType === 'LOGIN')) {
    allStreaks.unshift({
      streakType: 'LOGIN',
      currentStreak: summary.currentLoginStreak || 0,
      longestStreak: summary.longestLoginStreak || 0,
      isActive: summary.currentLoginStreak > 0,
      bonusThresholdsReached: [],
    });
  }

  if (allStreaks.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <FireIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No Streaks Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start performing activities daily to build streaks and earn bonus points!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Streak Milestones Info */}
      <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Streak Milestones
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {STREAK_MILESTONES.map((milestone) => (
              <Chip
                key={milestone.days}
                label={`${milestone.days} days = +${milestone.bonus} pts`}
                variant="outlined"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Streak Cards */}
      <Grid container spacing={3}>
        {allStreaks.map((streak, index) => (
          <Grid item xs={12} md={6} lg={4} key={streak.streakType}>
            <StreakCard streak={streak} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StreakTracker;
