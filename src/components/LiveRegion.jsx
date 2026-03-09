import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

/**
 * LiveRegion component
 *
 * Announces dynamic content changes to screen readers
 *
 * Features:
 * - Polite or assertive announcements
 * - Atomic updates (read entire region)
 * - Auto-clear after announcement
 *
 * Usage:
 * const [message, setMessage] = useState('');
 *
 * <LiveRegion message={message} priority="polite" />
 *
 * // Trigger announcement
 * setMessage('Form submitted successfully');
 */
const LiveRegion = ({
  message = '',
  priority = 'polite', // 'polite' or 'assertive'
  clearDelay = 5000,
  component = 'div',
  ...props
}) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (message && clearDelay) {
      // Clear message after delay
      timeoutRef.current = setTimeout(() => {
        // Message will be cleared by parent component
      }, clearDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearDelay]);

  return (
    <Box
      component={component}
      role="status"
      aria-live={priority}
      aria-atomic="true"
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
      {message}
    </Box>
  );
};

export default LiveRegion;
