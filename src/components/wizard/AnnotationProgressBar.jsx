import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const STEPS = [
  { label: 'Generating', range: [0, 5] },
  { label: 'Processing', range: [5, 80] },
  { label: 'Encoding', range: [80, 90] },
  { label: 'Uploading', range: [90, 99] },
  { label: 'Done', range: [99, 100] },
];

const getActiveStep = (percent) => {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (percent >= STEPS[i].range[0]) return i;
  }
  return 0;
};

const AnnotationProgressBar = ({ percent = 0, statusText }) => {
  const activeIdx = getActiveStep(percent);

  return (
    <Box>
      {/* Step labels */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        {STEPS.map((step, i) => (
          <Typography
            key={step.label}
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              fontWeight: i === activeIdx ? 700 : 400,
              color: i < activeIdx ? 'success.main' : i === activeIdx ? 'primary.main' : 'text.disabled',
            }}
          >
            {step.label}
          </Typography>
        ))}
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            backgroundColor: percent >= 100 ? 'success.main' : 'primary.main',
          },
        }}
      />

      {/* Status text */}
      {statusText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
          {statusText}
        </Typography>
      )}
    </Box>
  );
};

export default AnnotationProgressBar;
