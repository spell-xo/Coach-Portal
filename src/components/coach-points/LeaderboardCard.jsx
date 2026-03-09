import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  EmojiEvents as TrophyIcon,
  WorkspacePremium as MedalIcon,
} from '@mui/icons-material';

const getRankColor = (rank) => {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return '#666';
  }
};

const getRankIcon = (rank) => {
  if (rank <= 3) {
    return <TrophyIcon sx={{ color: getRankColor(rank) }} />;
  }
  return null;
};

const LeaderboardItem = ({ entry, rank, index }) => {
  const coach = entry.coachId || {};
  const initials = `${coach.firstName?.[0] || ''}${coach.lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <ListItem
      component={motion.div}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      sx={{
        py: 2,
        bgcolor: rank <= 3 ? `${getRankColor(rank)}10` : 'transparent',
        borderRadius: 1,
        mb: 1,
      }}
    >
      {/* Rank */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: rank <= 3 ? getRankColor(rank) : 'action.hover',
          color: rank <= 3 ? 'white' : 'text.primary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          mr: 2,
        }}
      >
        {rank}
      </Box>

      {/* Avatar */}
      <ListItemAvatar>
        <Avatar
          src={coach.profilePicture}
          sx={{
            width: 48,
            height: 48,
            border: rank <= 3 ? `2px solid ${getRankColor(rank)}` : 'none',
          }}
        >
          {initials}
        </Avatar>
      </ListItemAvatar>

      {/* Name & Info */}
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={rank <= 3 ? 'bold' : 'normal'}>
              {coach.firstName} {coach.lastName}
            </Typography>
            {getRankIcon(rank)}
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip
              size="small"
              label={`Level ${entry.level || 1}`}
              variant="outlined"
            />
            {entry.currentLoginStreak > 0 && (
              <Chip
                size="small"
                label={`🔥 ${entry.currentLoginStreak} day streak`}
                variant="outlined"
                color="warning"
              />
            )}
          </Box>
        }
      />

      {/* Points */}
      <Box sx={{ textAlign: 'right' }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          color={rank === 1 ? 'warning.main' : 'primary.main'}
        >
          {entry.totalPoints?.toLocaleString() || 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          points
        </Typography>
      </Box>
    </ListItem>
  );
};

const LeaderboardCard = ({ leaderboard, title = 'Club Leaderboard' }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <MedalIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No Leaderboard Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Earn points to appear on the leaderboard!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <TrophyIcon sx={{ fontSize: 32, color: 'warning.main' }} />
          <Typography variant="h5" fontWeight="bold">
            {title}
          </Typography>
        </Box>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 2,
              mb: 4,
              py: 3,
              bgcolor: 'action.hover',
              borderRadius: 2,
            }}
          >
            {/* 2nd Place */}
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={leaderboard[1]?.coachId?.profilePicture}
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  border: `3px solid ${getRankColor(2)}`,
                }}
              >
                {`${leaderboard[1]?.coachId?.firstName?.[0] || ''}${leaderboard[1]?.coachId?.lastName?.[0] || ''}`}
              </Avatar>
              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                {leaderboard[1]?.coachId?.firstName}
              </Typography>
              <Box
                sx={{
                  width: 80,
                  height: 60,
                  bgcolor: getRankColor(2),
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight="bold" color="white">
                  2
                </Typography>
              </Box>
            </Box>

            {/* 1st Place */}
            <Box sx={{ textAlign: 'center' }}>
              <TrophyIcon sx={{ fontSize: 32, color: getRankColor(1) }} />
              <Avatar
                src={leaderboard[0]?.coachId?.profilePicture}
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  border: `4px solid ${getRankColor(1)}`,
                }}
              >
                {`${leaderboard[0]?.coachId?.firstName?.[0] || ''}${leaderboard[0]?.coachId?.lastName?.[0] || ''}`}
              </Avatar>
              <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                {leaderboard[0]?.coachId?.firstName}
              </Typography>
              <Typography variant="caption" color="warning.main">
                {leaderboard[0]?.totalPoints?.toLocaleString()} pts
              </Typography>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: getRankColor(1),
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h4" fontWeight="bold" color="white">
                  1
                </Typography>
              </Box>
            </Box>

            {/* 3rd Place */}
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={leaderboard[2]?.coachId?.profilePicture}
                sx={{
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  border: `3px solid ${getRankColor(3)}`,
                }}
              >
                {`${leaderboard[2]?.coachId?.firstName?.[0] || ''}${leaderboard[2]?.coachId?.lastName?.[0] || ''}`}
              </Avatar>
              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                {leaderboard[2]?.coachId?.firstName}
              </Typography>
              <Box
                sx={{
                  width: 80,
                  height: 40,
                  bgcolor: getRankColor(3),
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h6" fontWeight="bold" color="white">
                  3
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Full List */}
        <List disablePadding>
          {leaderboard.map((entry, index) => (
            <LeaderboardItem
              key={entry._id || index}
              entry={entry}
              rank={index + 1}
              index={index}
            />
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default LeaderboardCard;
