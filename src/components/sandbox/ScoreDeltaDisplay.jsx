import React from 'react';
import { Box, Typography } from '@mui/material';

const formatDelta = (delta) => {
  if (delta == null) return '';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}`;
};

const ScoreDeltaDisplay = ({ label, original, patched, delta }) => {
  const getDeltaColor = (d) => {
    if (d > 0) return 'success.main';
    if (d < 0) return 'error.main';
    return 'text.secondary';
  };

  const computedDelta = delta != null ? delta : (patched != null && original != null ? patched - original : null);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
      {label && (
        <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 600 }}>
          {label}
        </Typography>
      )}
      <Typography variant="body2">
        {original != null ? original.toFixed(1) : 'N/A'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        →
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {patched != null ? patched.toFixed(1) : 'N/A'}
      </Typography>
      {computedDelta != null && (
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ color: getDeltaColor(computedDelta) }}
        >
          ({formatDelta(computedDelta)})
        </Typography>
      )}
    </Box>
  );
};

export default ScoreDeltaDisplay;
