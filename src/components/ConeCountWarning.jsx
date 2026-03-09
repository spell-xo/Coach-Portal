import React from 'react';
import { Tooltip, Box, Typography } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import RequireRole from './RequireRole';

/**
 * Cone Count Warning Component
 * Displays a warning icon with tooltip when drill cone count doesn't match expected
 * Only visible to head_coach, club_manager, and PLATFORM_ADMIN roles
 *
 * @param {Object} props
 * @param {Object} props.drill - Drill object with cone validation data
 * @param {string} props.size - Icon size ('small' | 'medium' | 'large')
 * @returns {JSX.Element|null}
 */
const ConeCountWarning = ({ drill, size = 'small' }) => {
  // Don't render if no validation data available
  if (!drill?.hasConeCountData) {
    return null;
  }

  // Don't render if cone counts match
  if (!drill?.isConeCountMismatch) {
    return null;
  }

  // Calculate difference direction for message
  const actualCount = drill.manuallyAnnotatedConeCount > 0
    ? drill.manuallyAnnotatedConeCount
    : drill.detectedConeCount;
  const difference = drill.coneCountDifference || (actualCount - drill.expectedConeCount);
  const differenceText = difference > 0
    ? `${Math.abs(difference)} more than expected`
    : `${Math.abs(difference)} fewer than expected`;

  // Format tooltip content
  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Cone Count Mismatch
      </Typography>
      <Typography variant="body2">
        Expected: {drill.expectedConeCount} cones
      </Typography>
      {drill.detectedConeCount !== null && drill.detectedConeCount !== undefined && (
        <Typography variant="body2">
          Detected: {drill.detectedConeCount} cones
        </Typography>
      )}
      {drill.manuallyAnnotatedConeCount > 0 && (
        <Typography variant="body2">
          Manually Annotated: {drill.manuallyAnnotatedConeCount} cones
        </Typography>
      )}
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
            color: '#ed6c02', // Use a slightly different orange to distinguish from pattern warning
            cursor: 'pointer',
            verticalAlign: 'middle',
            '&:hover': {
              color: '#e65100' // darker orange on hover
            }
          }}
        />
      </Tooltip>
    </RequireRole>
  );
};

/**
 * Cone Count Info Component
 * Displays cone count info in drill detail views
 * Shows mismatch warning box for authorized roles
 *
 * @param {Object} props
 * @param {Object} props.drill - Drill object with cone validation data
 */
export const ConeCountInfo = ({ drill }) => {
  if (!drill?.hasConeCountData) {
    return null;
  }

  const actualCount = drill.manuallyAnnotatedConeCount > 0
    ? drill.manuallyAnnotatedConeCount
    : drill.detectedConeCount;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        <strong>Cone Count:</strong>{' '}
        {drill.detectedConeCount !== null && drill.detectedConeCount !== undefined && (
          <>{drill.detectedConeCount} detected</>
        )}
        {drill.manuallyAnnotatedConeCount > 0 && (
          <>, {drill.manuallyAnnotatedConeCount} manually annotated</>
        )}
        {drill.expectedConeCount !== null && drill.expectedConeCount !== undefined && (
          <> (expected: {drill.expectedConeCount})</>
        )}
      </Typography>

      {/* Cone Count Mismatch Warning - Only for Authorized Roles */}
      <RequireRole roles={['club_manager', 'head_coach']}>
        {drill.isConeCountMismatch && (
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
              Cone count mismatch detected. Expected {drill.expectedConeCount} cones
              but found {actualCount}.
            </Typography>
          </Box>
        )}
      </RequireRole>
    </Box>
  );
};

export default ConeCountWarning;
