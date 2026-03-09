import React from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';

const formatDelta = (delta) => {
  if (delta == null) return '';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}`;
};

const getDeltaColor = (delta) => {
  if (delta > 0) return 'success.main';
  if (delta < 0) return 'error.main';
  return 'text.secondary';
};

const getBorderColor = (result) => {
  if (!result?.area_deltas) return 'primary.main';
  const deltas = Object.values(result.area_deltas);
  const hasNegative = deltas.some((d) => d < 0);
  const hasPositive = deltas.some((d) => d > 0);
  if (hasNegative && hasPositive) return 'warning.main';
  if (hasNegative) return 'error.main';
  return 'success.main';
};

const SandboxResultCard = ({ result, onViewFull, onTestMore, onTweak }) => {
  if (!result) return null;

  const { drill_id, game_type, original_score, test_score, delta, area_deltas, original_activities, test_activities } = result;

  return (
    <Paper
      variant="outlined"
      sx={{
        mx: 2,
        mb: 1.5,
        p: 1.5,
        borderColor: getBorderColor(result),
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ScienceIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="caption" fontWeight={600}>
          Sandbox Result
        </Typography>
        {game_type && (
          <Chip label={game_type.replace(/_/g, ' ')} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
        )}
      </Box>

      {drill_id && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem', fontFamily: 'monospace' }}>
          Drill: {drill_id}
        </Typography>
      )}

      {/* Score delta */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Typography variant="caption" fontWeight={600}>Score:</Typography>
        <Typography variant="caption">{original_score?.toFixed(1)}</Typography>
        <Typography variant="caption" color="text.secondary">&rarr;</Typography>
        <Typography variant="caption" fontWeight={600}>{test_score?.toFixed(1)}</Typography>
        {delta != null && (
          <Typography variant="caption" fontWeight={700} sx={{ color: getDeltaColor(delta) }}>
            ({formatDelta(delta)})
          </Typography>
        )}
      </Box>

      {/* Activity delta */}
      {(original_activities != null || test_activities != null) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <Typography variant="caption" fontWeight={600}>Activities:</Typography>
          <Typography variant="caption">{original_activities}</Typography>
          <Typography variant="caption" color="text.secondary">&rarr;</Typography>
          <Typography variant="caption">{test_activities}</Typography>
          {original_activities != null && test_activities != null && (
            <Typography variant="caption" sx={{ color: getDeltaColor(test_activities - original_activities) }}>
              ({formatDelta(test_activities - original_activities)})
            </Typography>
          )}
        </Box>
      )}

      {/* Area deltas */}
      {area_deltas && Object.keys(area_deltas).length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {Object.entries(area_deltas).map(([area, d]) => (
            <Typography key={area} variant="caption" sx={{ fontSize: '0.65rem', color: getDeltaColor(d) }}>
              {area}: {formatDelta(d)}
            </Typography>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {onViewFull && (
          <Button
            size="small"
            variant="contained"
            startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            onClick={() => onViewFull(result)}
            sx={{ fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none' }}
          >
            View Full Comparison
          </Button>
        )}
        {onTestMore && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrowIcon sx={{ fontSize: 14 }} />}
            onClick={() => onTestMore(result)}
            sx={{ fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none' }}
          >
            Test More Drills
          </Button>
        )}
        {onTweak && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: 14 }} />}
            onClick={() => onTweak(result)}
            sx={{ fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none' }}
          >
            Tweak Patch
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default SandboxResultCard;
