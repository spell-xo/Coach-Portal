import React from 'react';
import { Box, Typography, Paper, Button, IconButton, Tooltip } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AnnotationProgressBar from './AnnotationProgressBar';

const AnnotationCard = ({ annotation, onView, onSave }) => {
  if (!annotation) return null;

  const { status, percent, statusText, videoUrl, description, duration, frames, error } = annotation;

  return (
    <Paper
      variant="outlined"
      sx={{
        mx: 2,
        mb: 1.5,
        p: 1.5,
        borderColor: status === 'failed' ? 'error.main' : status === 'completed' ? 'success.main' : 'grey.300',
        borderRadius: 2,
      }}
    >
      {/* Processing state */}
      {status === 'processing' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MovieIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600}>
              Generating annotation...
            </Typography>
          </Box>
          <AnnotationProgressBar percent={percent} statusText={statusText} />
        </Box>
      )}

      {/* Completed state */}
      {status === 'completed' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MovieIcon sx={{ fontSize: 18, color: 'success.main' }} />
            <Typography variant="caption" fontWeight={600} color="success.main">
              Annotation ready
            </Typography>
          </Box>

          {description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.7rem' }}>
              {description}
            </Typography>
          )}

          {(duration != null || frames != null) && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1, fontSize: '0.65rem' }}>
              {duration != null && `${duration.toFixed(1)}s`}
              {duration != null && frames != null && ' · '}
              {frames != null && `${frames} frames`}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {videoUrl && onView && (
              <Button
                size="small"
                variant="contained"
                startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                onClick={() => onView(videoUrl)}
                sx={{ fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none' }}
              >
                View
              </Button>
            )}
            {videoUrl && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                component="a"
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                sx={{ fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none' }}
              >
                Download
              </Button>
            )}
            {onSave && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<SaveIcon sx={{ fontSize: 14 }} />}
                onClick={() => onSave(annotation.id)}
                sx={{ fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none' }}
              >
                Save
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Failed state */}
      {status === 'failed' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ErrorOutlineIcon sx={{ fontSize: 18, color: 'error.main' }} />
            <Typography variant="caption" fontWeight={600} color="error.main">
              Annotation failed
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
            {error || 'An error occurred while generating the annotation. Try again with a different request.'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AnnotationCard;
