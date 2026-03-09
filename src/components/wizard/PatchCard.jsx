import React from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import DifferenceIcon from '@mui/icons-material/Difference';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const PatchCard = ({ patch, onViewDiff, onTest }) => {
  if (!patch) return null;

  const { patch_id, version, description, files_modified } = patch;

  return (
    <Paper
      variant="outlined"
      sx={{
        mx: 2,
        mb: 1.5,
        p: 1.5,
        borderColor: 'primary.main',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <CodeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="caption" fontWeight={600}>
          Code Patch {patch_id} (v{version || 1})
        </Typography>
      </Box>

      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.7rem' }}>
          {description}
        </Typography>
      )}

      {files_modified?.length > 0 && (
        <Box sx={{ mb: 1 }}>
          {files_modified.map((file) => (
            <Chip
              key={file}
              label={file}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: '0.6rem', mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {onViewDiff && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<DifferenceIcon sx={{ fontSize: 14 }} />}
            onClick={() => onViewDiff(patch)}
            sx={{ fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none' }}
          >
            View Diff
          </Button>
        )}
        {onTest && (
          <Button
            size="small"
            variant="contained"
            startIcon={<PlayArrowIcon sx={{ fontSize: 14 }} />}
            onClick={() => onTest(patch)}
            sx={{ fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none' }}
          >
            Test on This Drill
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default PatchCard;
