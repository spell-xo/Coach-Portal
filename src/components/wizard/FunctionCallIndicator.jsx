import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import PsychologyIcon from '@mui/icons-material/Psychology';

const FunctionCallIndicator = ({ activeCalls, isThinking }) => {
  const hasActiveCalls = activeCalls && activeCalls.length > 0;
  if (!hasActiveCalls && !isThinking) return null;

  return (
    <Box sx={{ px: 2, py: 1 }}>
      {hasActiveCalls && activeCalls.map((call, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 0.5,
            px: 1.5,
            mb: 0.5,
            borderRadius: 1,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <CircularProgress size={14} thickness={5} />
          <BuildIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {call || 'Processing...'}
          </Typography>
        </Box>
      ))}
      {isThinking && !hasActiveCalls && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 0.5,
            px: 1.5,
            mb: 0.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'primary.light',
          }}
        >
          <CircularProgress size={14} thickness={5} />
          <PsychologyIcon sx={{ fontSize: 14, color: 'primary.main' }} />
          <Typography variant="caption" color="text.secondary">
            Peil is thinking...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FunctionCallIndicator;
