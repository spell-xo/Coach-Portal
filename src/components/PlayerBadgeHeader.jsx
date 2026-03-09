import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';

/**
 * PlayerBadgeHeader Component
 * Displays player's highest achievement badge at the top of player report
 * Shows level, total score, division, player photo, name, and skill stats
 * Based on PRD-Coach-Portal-Player-Badge-Header.md
 */
const PlayerBadgeHeader = ({ badgeData }) => {
  if (!badgeData) return null;

  const {
    playerName,
    profilePicture,
    highestLevel,
    skills
  } = badgeData;

  // Get division colors matching mobile app
  const getDivisionColor = (division) => {
    const colors = {
      'Diamond': {
        bg: 'linear-gradient(135deg, #e0ffff, #b0e0e6)',
        text: 'rgba(154, 249, 216, 1)',
        headingText: 'rgba(255, 255, 255, 1)'
      },
      'Gold': {
        bg: 'linear-gradient(135deg, #fff9e6, #ffe4b3)',
        text: 'rgba(249, 249, 154, 1)',
        headingText: 'rgba(255, 255, 255, 1)'
      },
      'Silver': {
        bg: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)',
        text: 'rgba(237, 237, 237, 1)',
        headingText: 'rgba(255, 255, 255, 1)'
      },
      'Bronze': {
        bg: 'linear-gradient(135deg, #ffe4cc, #d9a679)',
        text: 'rgba(255, 193, 112, 1)',
        headingText: 'rgba(255, 255, 255, 1)'
      },
      'Beginner': {
        bg: 'linear-gradient(135deg, #f0f0f0, #d4d4d4)',
        text: 'rgba(30, 30, 30, 1)',
        headingText: 'rgba(119, 119, 119, 1)'
      }
    };
    return colors[division] || colors['Beginner'];
  };

  const divisionColors = getDivisionColor(highestLevel.division);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 4,
        px: 2
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: { xs: '280px', sm: '300px' },
          background: divisionColors.bg,
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          clipPath: 'polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)',
          p: { xs: 2, sm: 3 },
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Level Section */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: divisionColors.text,
              fontFamily: "'Oswald', sans-serif",
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}
          >
            {highestLevel.level}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: divisionColors.headingText,
              letterSpacing: '1px',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '0.75rem'
            }}
          >
            LEVEL
          </Typography>
        </Box>

        {/* Total Score Section */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: divisionColors.text,
              fontFamily: "'Oswald', sans-serif",
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}
          >
            {highestLevel.totalScore % 1 === 0
              ? highestLevel.totalScore.toFixed(0)
              : highestLevel.totalScore.toFixed(1)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: divisionColors.headingText,
              letterSpacing: '1px',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '0.75rem'
            }}
          >
            TOTAL SCORE
          </Typography>
        </Box>

        {/* Division Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: divisionColors.text,
              fontFamily: "'Oswald', sans-serif",
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            {highestLevel.division.toUpperCase()}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: divisionColors.headingText,
              letterSpacing: '1px',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '0.75rem'
            }}
          >
            DIVISION
          </Typography>
        </Box>

        {/* Player Photo Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2
          }}
        >
          <Avatar
            src={profilePicture}
            alt={playerName}
            sx={{
              width: { xs: '140px', sm: '180px' },
              height: { xs: '140px', sm: '180px' },
              border: '4px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          />
        </Box>

        {/* Player Name Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: '#1f2937',
              letterSpacing: '1px',
              fontFamily: "'Oswald', sans-serif",
              fontSize: { xs: '1.5rem', sm: '1.875rem' },
              textTransform: 'uppercase'
            }}
          >
            {playerName && playerName.length > 15
              ? playerName.slice(0, 15).toUpperCase() + '…'
              : (playerName || '').toUpperCase()}
          </Typography>
        </Box>

        {/* Skill Stats Section */}
        <Box sx={{ mt: 2 }}>
          {/* First Row: PAC | DRI */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#1f2937',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {skills.PAC}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#6b7280',
                  letterSpacing: '0.5px',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                PAC
              </Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{
                color: '#d1d5db',
                fontWeight: 300,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              |
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#1f2937',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {skills.DRI}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#6b7280',
                  letterSpacing: '0.5px',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                DRI
              </Typography>
            </Box>
          </Box>

          {/* Second Row: PAS | CTR */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#1f2937',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {skills.PAS}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#6b7280',
                  letterSpacing: '0.5px',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                PAS
              </Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{
                color: '#d1d5db',
                fontWeight: 300,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              |
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#1f2937',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {skills.CTR}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#6b7280',
                  letterSpacing: '0.5px',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                CTR
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PlayerBadgeHeader;
