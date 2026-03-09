import React from 'react';
import { Box, Typography, Button, Chip, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LockIcon from '@mui/icons-material/Lock';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircleIcon,
    color: '#10B981',
    bgColor: '#ECFDF5',
    label: 'Completed',
  },
  in_progress: {
    icon: HourglassEmptyIcon,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    label: 'In Progress',
  },
  processing: {
    icon: HourglassEmptyIcon,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    label: 'Processing',
  },
  not_started: {
    icon: RadioButtonUncheckedIcon,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    label: 'Not Started',
  },
  locked: {
    icon: LockIcon,
    color: '#9CA3AF',
    bgColor: '#F9FAFB',
    label: 'Locked',
  },
};

/**
 * DrillListItem Component
 * Displays a single drill item with status, score, and action buttons
 *
 * @param {string} drillName - Name of the drill
 * @param {number} level - Drill level (1-3)
 * @param {string} status - Drill status ('completed', 'in_progress', 'processing', 'not_started', 'locked')
 * @param {number} score - Drill score (0-100)
 * @param {function} onView - Handler for view button
 * @param {function} onStart - Handler for start/upload button
 * @param {boolean} required - Whether drill is required
 * @param {number} progress - Processing progress (0-100)
 */
const DrillListItem = ({
  drillName,
  level,
  status = 'not_started',
  score = null,
  onView,
  onStart,
  required = true,
  progress = null,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const StatusIcon = config.icon;
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isProcessing = status === 'processing';
  const isInProgress = status === 'in_progress';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: isLocked ? '#FAFAFA' : 'background.paper',
        opacity: isLocked ? 0.6 : 1,
        transition: 'all 0.2s ease',
        '&:hover': isLocked ? {} : {
          borderColor: config.color,
          backgroundColor: config.bgColor,
          boxShadow: 1,
        },
      }}
    >
      {/* Status Icon */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          backgroundColor: config.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <StatusIcon sx={{ fontSize: 24, color: config.color }} />
      </Box>

      {/* Drill Info */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {drillName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            - Level {level}
          </Typography>
          {!required && (
            <Chip label="Optional" size="small" variant="outlined" sx={{ height: 20 }} />
          )}
        </Box>

        {/* Processing Progress */}
        {isProcessing && progress !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {progress}%
            </Typography>
          </Box>
        )}

        {/* Status Text */}
        <Typography variant="body2" color="text.secondary">
          {isCompleted && score !== null && `Score: ${score.toFixed(1)}`}
          {isInProgress && 'Video uploaded, awaiting processing'}
          {isProcessing && 'Processing your video...'}
          {status === 'not_started' && 'Ready to upload'}
          {isLocked && 'Complete previous drills to unlock'}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {isCompleted && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={onView}
            sx={{ textTransform: 'none' }}
          >
            View
          </Button>
        )}

        {(status === 'not_started' || isInProgress) && !isLocked && (
          <Button
            variant="contained"
            size="small"
            startIcon={status === 'not_started' ? <CloudUploadIcon /> : <PlayCircleIcon />}
            onClick={onStart}
            sx={{ textTransform: 'none' }}
          >
            {status === 'not_started' ? 'Upload Video' : 'Re-upload'}
          </Button>
        )}

        {isProcessing && (
          <Chip
            label="Processing"
            size="small"
            sx={{
              backgroundColor: config.bgColor,
              color: config.color,
              fontWeight: 600,
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default DrillListItem;
