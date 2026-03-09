import React from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

/**
 * PlayerLevelBadge Component
 * Displays player's level, total score, division and skill scores
 * Styled similar to the mobile app's player card
 */
const PlayerLevelBadge = ({ levelData }) => {
  if (!levelData) return null;

  const { level, totalScore, isLocked, scores } = levelData;

  // Determine division/medal based on total score
  const getMedal = (score) => {
    if (score >= 80) return { name: 'Diamond', color: '#9af9d8' };
    if (score >= 60) return { name: 'Gold', color: '#f9f99a' };
    if (score >= 40) return { name: 'Silver', color: '#ededed' };
    if (score >= 20) return { name: 'Bronze', color: '#ffc170' };
    return { name: 'Beginner', color: '#1e1e1e' };
  };

  const medal = getMedal(totalScore);
  const isLowScore = totalScore < 40;

  // Create gradient background based on division
  const getBackgroundGradient = () => {
    if (isLocked) {
      return 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)';
    }

    if (totalScore >= 80) return 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
    if (totalScore >= 60) return 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
    if (totalScore >= 40) return 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)';
    if (totalScore >= 20) return 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
    return 'linear-gradient(135deg, #374151 0%, #4b5563 100%)';
  };

  const getScoreLabel = (key) => {
    const labels = {
      PAC: 'PACE',
      DRI: 'DRIBBLING',
      PAS: 'PASSING',
      CTR: 'CONTROL'
    };
    return labels[key] || key;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        background: getBackgroundGradient(),
        borderRadius: 3,
        p: 3,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 300,
        maxWidth: 500
      }}
    >
      {/* Locked overlay */}
      {isLocked && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: 'rgba(0,0,0,0.3)',
            px: 1.5,
            py: 0.5,
            borderRadius: 2
          }}
        >
          <LockIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" fontWeight={600}>
            LOCKED
          </Typography>
        </Box>
      )}

      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <EmojiEventsIcon sx={{ fontSize: 32, color: medal.color }} />
          <Typography variant="h3" fontWeight="bold" sx={{ color: medal.color }}>
            {level}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, letterSpacing: 1 }}>
          LEVEL
        </Typography>
      </Box>

      {/* Total Score Section */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" fontWeight="bold" sx={{ color: medal.color }}>
          {isLocked ? <LockIcon sx={{ fontSize: 48 }} /> : totalScore}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, letterSpacing: 1 }}>
          TOTAL SCORE
        </Typography>
      </Box>

      {/* Division/Medal Section */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Chip
          label={isLocked ? 'UNGRADED' : medal.name.toUpperCase()}
          sx={{
            bgcolor: isLocked ? 'rgba(255,255,255,0.2)' : medal.color,
            color: isLowScore ? '#1e1e1e' : '#000',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            px: 2,
            py: 2.5
          }}
        />
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
          DIVISION
        </Typography>
      </Box>

      {/* Skill Scores Grid */}
      <Grid container spacing={2}>
        {scores && scores.map((score, index) => (
          <Grid item xs={6} key={score.key}>
            <Box
              sx={{
                textAlign: 'center',
                py: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="h5" fontWeight="bold" sx={{ color: medal.color }}>
                {isLocked ? <LockIcon sx={{ fontSize: 24 }} /> : score.value}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, letterSpacing: 0.5, fontSize: '0.65rem' }}>
                {getScoreLabel(score.key)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {isLocked && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 2,
            opacity: 0.8,
            fontStyle: 'italic'
          }}
        >
          Complete previous level to unlock
        </Typography>
      )}
    </Paper>
  );
};

export default PlayerLevelBadge;
