import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const DAReviewNote = ({ review }) => {
  if (!review) return null;

  const { observations, suggestions, questions, recommended_next_tests } = review;
  const hasContent = observations?.length || suggestions?.length || questions?.length || recommended_next_tests?.length;

  if (!hasContent) return null;

  return (
    <Box sx={{ mx: 2, mb: 1.5 }}>
      <Alert
        severity="info"
        sx={{
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' },
          py: 0.5,
        }}
      >
        <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
          Review Note
        </Typography>

        {observations?.length > 0 && (
          <Box sx={{ mb: 0.5 }}>
            <ul style={{ margin: 0, paddingLeft: 16, listStyleType: 'disc' }}>
              {observations.map((obs, i) => (
                <li key={i}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{obs}</Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {suggestions?.length > 0 && (
          <Box sx={{ mb: 0.5 }}>
            {suggestions.map((sug, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', fontSize: '0.7rem', fontStyle: 'italic', color: 'text.secondary' }}>
                {sug}
              </Typography>
            ))}
          </Box>
        )}

        {questions?.length > 0 && (
          <Box sx={{ mb: 0.5, p: 0.75, bgcolor: 'warning.50', borderRadius: 1 }}>
            {questions.map((q, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
                {q}
              </Typography>
            ))}
          </Box>
        )}

        {recommended_next_tests?.length > 0 && (
          <Box>
            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              Suggested next tests:
            </Typography>
            {recommended_next_tests.map((test, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: 'text.secondary' }}>
                - {test}
              </Typography>
            ))}
          </Box>
        )}
      </Alert>
    </Box>
  );
};

export default DAReviewNote;
