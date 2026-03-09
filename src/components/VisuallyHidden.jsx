import React from 'react';
import { Box } from '@mui/material';

/**
 * VisuallyHidden component
 *
 * Hides content visually but keeps it accessible to screen readers
 * Also known as "sr-only" (screen reader only)
 *
 * Use cases:
 * - Icon-only buttons that need labels
 * - Additional context for screen readers
 * - Skip links
 * - Live regions for announcements
 *
 * Usage:
 * <button>
 *   <DeleteIcon />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 */
const VisuallyHidden = ({ children, component = 'span', ...props }) => {
  return (
    <Box
      component={component}
      sx={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default VisuallyHidden;
