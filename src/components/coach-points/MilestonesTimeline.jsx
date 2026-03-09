import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Star as StarIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

const ALL_MILESTONES = [
  { code: 'FIRST_100', name: 'Century', points: 100, icon: '🎯' },
  { code: 'FIRST_250', name: 'Quarter Master', points: 250, icon: '🌟' },
  { code: 'FIRST_500', name: 'High Flyer', points: 500, icon: '🚀' },
  { code: 'FIRST_1000', name: 'Point Master', points: 1000, icon: '👑' },
  { code: 'FIRST_2500', name: 'Point Pro', points: 2500, icon: '💎' },
  { code: 'FIRST_5000', name: 'Elite Coach', points: 5000, icon: '🏆' },
  { code: 'FIRST_10000', name: 'Legend', points: 10000, icon: '⭐' },
  { code: 'FIRST_25000', name: 'Hall of Fame', points: 25000, icon: '🌠' },
  { code: 'FIRST_50000', name: 'Coaching Icon', points: 50000, icon: '🔥' },
  { code: 'FIRST_100000', name: 'Immortal', points: 100000, icon: '✨' },
];

const MilestoneCard = ({ milestone, isReached, reachedData, totalPoints, index }) => {
  const progress = Math.min(100, (totalPoints / milestone.points) * 100);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: isReached ? 'success.light' : 'background.paper',
        border: '1px solid',
        borderColor: isReached ? 'success.main' : 'divider',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Progress background */}
      {!isReached && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress}%`,
            bgcolor: 'action.hover',
            zIndex: 0,
          }}
        />
      )}

      {/* Icon */}
      <Avatar
        sx={{
          width: 56,
          height: 56,
          bgcolor: isReached ? 'success.main' : 'action.disabledBackground',
          fontSize: '1.75rem',
          zIndex: 1,
        }}
      >
        {isReached ? milestone.icon : <LockIcon />}
      </Avatar>

      {/* Content */}
      <Box sx={{ flexGrow: 1, zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {milestone.name}
          </Typography>
          {isReached && (
            <CheckIcon color="success" fontSize="small" />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {milestone.points.toLocaleString()} points
        </Typography>
        {reachedData && (
          <Typography variant="caption" color="success.main">
            Achieved on {new Date(reachedData.reachedAt).toLocaleDateString()}
          </Typography>
        )}
        {!isReached && (
          <Typography variant="caption" color="text.secondary">
            {(milestone.points - totalPoints).toLocaleString()} points to go
          </Typography>
        )}
      </Box>

      {/* Status Chip */}
      <Chip
        label={isReached ? 'Achieved' : `${progress.toFixed(0)}%`}
        color={isReached ? 'success' : 'default'}
        variant={isReached ? 'filled' : 'outlined'}
        size="small"
        sx={{ zIndex: 1 }}
      />
    </Box>
  );
};

const MilestonesTimeline = ({ milestones, totalPoints }) => {
  const reachedCodes = milestones?.reached?.map(m => m.milestoneCode) || [];

  // Calculate stats
  const totalMilestones = ALL_MILESTONES.length;
  const achievedCount = reachedCodes.length;
  const nextMilestone = ALL_MILESTONES.find(m => !reachedCodes.includes(m.code));

  return (
    <Box>
      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6">Milestone Progress</Typography>
              <Typography variant="body2" color="text.secondary">
                {achievedCount} of {totalMilestones} milestones achieved
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {Array.from({ length: totalMilestones }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: i < achievedCount ? 'success.main' : 'action.disabledBackground',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i < achievedCount && <StarIcon sx={{ fontSize: 14, color: 'white' }} />}
                </Box>
              ))}
            </Box>

            {nextMilestone && (
              <Chip
                label={`Next: ${nextMilestone.name} (${nextMilestone.points.toLocaleString()} pts)`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Level Info */}
      {milestones && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                {milestones.level || 1}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {milestones.levelName || 'Rookie Coach'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Level {milestones.level || 1} • {milestones.pointsToNextLevel?.toLocaleString() || 0} points to level up
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ALL_MILESTONES.map((milestone, index) => {
          const isReached = reachedCodes.includes(milestone.code);
          const reachedData = milestones?.reached?.find(m => m.milestoneCode === milestone.code);

          return (
            <MilestoneCard
              key={milestone.code}
              milestone={milestone}
              isReached={isReached}
              reachedData={reachedData}
              totalPoints={totalPoints}
              index={index}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default MilestonesTimeline;
