import React from 'react';
import { Box, Chip } from '@mui/material';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';

const CONE_DRILL_TYPES = ['TRIPLE_CONE', 'SINGLE_CONE', 'DOUBLE_CONE', 'CONE'];

const SuggestedAnnotations = ({ onSelect, drillType }) => {
  const suggestions = [
    'Show ball and cone tracking',
    'Overlay activity boundaries',
    'Highlight loss events',
  ];

  // Add cone-specific suggestion for cone drills
  if (drillType && CONE_DRILL_TYPES.some((t) => drillType.toUpperCase().includes(t))) {
    suggestions.push('Show cone positions');
  }

  suggestions.push('Full analysis overlay');

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
        <MovieCreationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Box component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>
          Annotations
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {suggestions.map((text) => (
          <Chip
            key={text}
            label={text}
            size="small"
            variant="outlined"
            onClick={() => onSelect(text)}
            sx={{
              cursor: 'pointer',
              fontSize: '0.7rem',
              height: 'auto',
              borderColor: 'grey.400',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                py: 0.4,
              },
              '&:hover': {
                bgcolor: 'rgba(36, 255, 0, 0.08)',
                borderColor: '#24FF00',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SuggestedAnnotations;
