import React from 'react';
import { Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const LEVEL_COLORS = {
  0: {
    background: 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)',
    text: '#757575',
    border: '#9E9E9E',
  },
  1: {
    background: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
    text: '#FFFFFF',
    border: '#A0522D',
  },
  2: {
    background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
    text: '#FFFFFF',
    border: '#909090',
  },
  3: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    text: '#FFFFFF',
    border: '#DAA520',
  },
  4: {
    background: 'linear-gradient(135deg, #E5E4E2 0%, #B9F2FF 100%)',
    text: '#1976d2',
    border: '#87CEEB',
  },
  5: {
    background: 'linear-gradient(135deg, #4A148C 0%, #7B1FA2 100%)',
    text: '#FFFFFF',
    border: '#6A1B9A',
  },
};

const LEVEL_NAMES = {
  0: 'Unranked',
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
  5: 'Diamond',
};

/**
 * LevelBadge Component
 * Displays a visual badge for player's current level
 *
 * @param {number} level - Player's current level (0-5)
 * @param {number} size - Badge size ('small': 80, 'medium': 120, 'large': 160)
 * @param {boolean} showName - Whether to show level name below number
 */
const LevelBadge = ({ level = 0, size = 'medium', showName = true }) => {
  const sizeMap = {
    small: 80,
    medium: 120,
    large: 160,
  };

  const badgeSize = sizeMap[size] || sizeMap.medium;
  const iconSize = badgeSize * 0.3;
  const fontSize = badgeSize * 0.35;

  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[0];
  const levelName = LEVEL_NAMES[level] || 'Unranked';
  const isUnranked = level === 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: badgeSize,
          height: badgeSize,
          borderRadius: '50%',
          background: colors.background,
          border: `3px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        {isUnranked ? (
          <EmojiEventsIcon
            sx={{
              fontSize: iconSize,
              color: colors.text,
              opacity: 0.5,
            }}
          />
        ) : (
          <EmojiEventsIcon
            sx={{
              position: 'absolute',
              top: 8,
              fontSize: iconSize * 0.7,
              color: colors.text,
              opacity: 0.8,
            }}
          />
        )}

        <Typography
          variant="h3"
          sx={{
            color: colors.text,
            fontWeight: 700,
            fontSize: `${fontSize}px`,
            lineHeight: 1,
            marginTop: isUnranked ? 0 : 1,
          }}
        >
          {isUnranked ? '?' : level}
        </Typography>

        {!isUnranked && (
          <Typography
            variant="caption"
            sx={{
              color: colors.text,
              fontWeight: 600,
              fontSize: `${fontSize * 0.25}px`,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Level
          </Typography>
        )}
      </Box>

      {showName && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          {levelName}
        </Typography>
      )}
    </Box>
  );
};

export default LevelBadge;
