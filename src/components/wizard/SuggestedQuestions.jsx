import React from 'react';
import { Box, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SuggestedAnnotations from './SuggestedAnnotations';

const SuggestedQuestions = ({ drill, scores, onSelect }) => {
  const suggestions = [];

  if (scores?.total_score != null) {
    suggestions.push(`Why did this drill score ${Math.round(scores.total_score)}%?`);
  }

  suggestions.push(
    'How many activities were expected vs detected?',
    'Are there any cone detection issues?',
    'Check the scoring configuration',
    'Are there any loss-of-control events?'
  );

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <AutoAwesomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          Suggested questions
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {suggestions.map((question, index) => (
          <Chip
            key={index}
            label={question}
            size="small"
            variant="outlined"
            onClick={() => onSelect(question)}
            sx={{
              cursor: 'pointer',
              fontSize: '0.75rem',
              height: 'auto',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                py: 0.5,
              },
              '&:hover': {
                bgcolor: 'primary.50',
                borderColor: 'primary.main',
              },
            }}
          />
        ))}
      </Box>
      <SuggestedAnnotations onSelect={onSelect} drillType={drill?.gameType} />
    </Box>
  );
};

export default SuggestedQuestions;
