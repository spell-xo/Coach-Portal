import React from 'react';
import { Box, Typography } from '@mui/material';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  return (
    <Box sx={{ px: 2, py: 1, backgroundColor: 'action.hover' }}>
      <Typography variant="caption" color="text.secondary">
        {getTypingText()}
      </Typography>
      <Box sx={{ display: 'inline-flex', gap: 0.5, ml: 0.5 }}>
        <Box
          className="dot-flashing"
          sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'text.secondary',
            animation: 'dotFlashing 1s infinite',
            '@keyframes dotFlashing': {
              '0%, 100%': { opacity: 0.2 },
              '50%': { opacity: 1 }
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default TypingIndicator;
