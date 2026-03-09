import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';

const STEP_LABELS = {
  applying: 'Applying patch...',
  detecting: 'Detecting patterns...',
  scoring: 'Running scoring pipeline...',
  comparing: 'Comparing results...',
  complete: 'Complete',
};

const SandboxProgressIndicator = ({ progress }) => {
  if (!progress) return null;

  const { step, percent, status_text } = progress;
  const label = status_text || STEP_LABELS[step] || step || 'Processing...';

  return (
    <Box
      sx={{
        mx: 2,
        mb: 1.5,
        p: 1.5,
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ScienceIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="caption" fontWeight={600}>
          Sandbox Test
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <LinearProgress
        variant={percent != null ? 'determinate' : 'indeterminate'}
        value={percent || 0}
        sx={{ borderRadius: 1, height: 4 }}
      />
      {percent != null && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25, fontSize: '0.65rem', textAlign: 'right' }}>
          {Math.round(percent)}%
        </Typography>
      )}
    </Box>
  );
};

export default SandboxProgressIndicator;
