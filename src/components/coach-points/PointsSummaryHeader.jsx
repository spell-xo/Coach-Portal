import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
} from '@mui/icons-material';

const PointsSummaryHeader = ({ summary }) => {
  if (!summary) return null;

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        color: 'white',
      }}
    >
      <CardContent sx={{ py: 4 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Total Points */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: 'rgba(36, 255, 0, 0.2)',
                  mb: 2,
                }}
              >
                <TrophyIcon sx={{ fontSize: 48, color: '#24FF00' }} />
              </Box>
              <Typography variant="h2" fontWeight="bold" sx={{ color: '#24FF00' }}>
                {summary.totalPoints?.toLocaleString() || 0}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Total Points
              </Typography>
            </Box>
          </Grid>

          {/* Level & Progress */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: '#24FF00',
                  color: 'black',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                }}
              >
                {summary.level || 1}
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                {summary.levelName || 'Rookie Coach'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`${summary.pointsToNextLevel || 0} pts to next level`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Stats */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  This Month
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {summary.totalPointsThisMonth?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  This Week
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {summary.totalPointsThisWeek?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Today
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#24FF00' }}>
                  {summary.totalPointsToday?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Milestones
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ fontSize: 18, color: '#FFD700' }} />
                  <Typography variant="h6" fontWeight="bold">
                    {summary.milestonesReached?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PointsSummaryHeader;
