import React from 'react';
import { Box, IconButton, Button } from '@mui/material';

/**
 * TouchTarget component
 *
 * Ensures minimum 44x44px touch target for mobile accessibility
 * WCAG 2.1 AAA - Target Size (2.5.5)
 *
 * Features:
 * - Automatic padding to meet 44x44px minimum
 * - Works with buttons, icons, and custom elements
 * - Visual feedback on touch
 * - Prevents accidental taps
 *
 * Usage:
 * <TouchTarget>
 *   <IconButton><DeleteIcon /></IconButton>
 * </TouchTarget>
 */
const TouchTarget = ({
  children,
  minSize = 44,
  component = 'div',
  sx = {},
  ...props
}) => {
  return (
    <Box
      component={component}
      sx={{
        minWidth: `${minSize}px`,
        minHeight: `${minSize}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        // Touch feedback
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        // Prevent double-tap zoom
        userSelect: 'none',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

/**
 * TouchButton - Button optimized for mobile
 */
export const TouchButton = ({
  children,
  variant = 'contained',
  fullWidth = false,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      fullWidth={fullWidth}
      sx={{
        minHeight: 44,
        padding: '12px 24px',
        fontSize: '16px', // Prevents zoom on iOS
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        // Larger touch target on mobile
        '@media (max-width: 600px)': {
          minHeight: 48,
          padding: '14px 28px',
        },
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

/**
 * TouchIconButton - IconButton optimized for mobile
 */
export const TouchIconButton = ({ children, ...props }) => {
  return (
    <IconButton
      sx={{
        minWidth: 44,
        minHeight: 44,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        '@media (max-width: 600px)': {
          minWidth: 48,
          minHeight: 48,
        },
      }}
      {...props}
    >
      {children}
    </IconButton>
  );
};

export default TouchTarget;
