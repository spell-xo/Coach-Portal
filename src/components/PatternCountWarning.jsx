import React from 'react';
import { Tooltip, Box, Typography } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import RequireRole from './RequireRole';

/**
 * Pattern Count Warning Component
 * Displays a warning icon with tooltip when drill pattern count doesn't match expected
 * Only visible to head_coach, club_manager, and PLATFORM_ADMIN roles
 *
 * @param {Object} props
 * @param {Object} props.drill - Drill object with pattern validation data
 * @param {string} props.size - Icon size ('small' | 'medium' | 'large')
 * @returns {JSX.Element|null}
 */
const PatternCountWarning = ({ drill, size = 'small' }) => {
  // Don't render if no validation data available
  if (!drill?.hasPatternCountData) {
    return null;
  }

  // Don't render if pattern counts match
  if (!drill?.isPatternCountMismatch) {
    return null;
  }

  // Calculate difference direction for message
  const difference = drill.patternCountDifference || (drill.detectedPatternCount - drill.expectedPatternCount);
  const differenceText = difference > 0
    ? `${Math.abs(difference)} more than expected`
    : `${Math.abs(difference)} fewer than expected`;

  // Format tooltip content
  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Pattern Count Mismatch
      </Typography>
      <Typography variant="body2">
        Expected: {drill.expectedPatternCount} patterns
      </Typography>
      <Typography variant="body2">
        Detected: {drill.detectedPatternCount} patterns
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: 'warning.light' }}>
        ({differenceText})
      </Typography>
    </Box>
  );

  return (
    <RequireRole roles={['club_manager', 'head_coach']}>
      <Tooltip
        title={tooltipContent}
        arrow
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: 'warning.dark',
              '& .MuiTooltip-arrow': {
                color: 'warning.dark'
              },
              maxWidth: 280
            }
          }
        }}
      >
        <WarningIcon
          fontSize={size}
          sx={{
            color: '#ff9800', // warning.main equivalent
            cursor: 'pointer',
            verticalAlign: 'middle',
            '&:hover': {
              color: '#ed6c02' // warning.dark equivalent
            }
          }}
        />
      </Tooltip>
    </RequireRole>
  );
};

/**
 * Pattern Count Info Component
 * Displays pattern count info in drill detail views
 * Shows mismatch warning box for authorized roles
 *
 * @param {Object} props
 * @param {Object} props.drill - Drill object with pattern validation data
 */
export const PatternCountInfo = ({ drill }) => {
  if (!drill?.hasPatternCountData) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        <strong>Pattern Count:</strong>{' '}
        {drill.detectedPatternCount || 0} detected
        {drill.expectedPatternCount !== null && drill.expectedPatternCount !== undefined && (
          <> (expected: {drill.expectedPatternCount})</>
        )}
      </Typography>

      {/* Pattern Count Mismatch Warning - Only for Authorized Roles */}
      <RequireRole roles={['club_manager', 'head_coach']}>
        {drill.isPatternCountMismatch && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 1,
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'warning.light',
              color: 'warning.dark'
            }}
          >
            <WarningIcon fontSize="small" />
            <Typography variant="body2">
              Pattern count mismatch detected. Expected {drill.expectedPatternCount} patterns
              but found {drill.detectedPatternCount}.
            </Typography>
          </Box>
        )}
      </RequireRole>
    </Box>
  );
};

export default PatternCountWarning;
