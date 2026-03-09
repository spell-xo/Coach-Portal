import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * PresenceIndicator component
 *
 * Displays a colored dot indicating user's online status
 *
 * Features:
 * - Online (green), Offline (grey), Away (yellow)
 * - Animated pulse effect for online status
 * - Tooltip with status and last seen
 * - Customizable size
 */
const PresenceIndicator = ({
  status = 'offline', // 'online', 'offline', 'away'
  lastSeen = null,
  size = 'small', // 'small', 'medium', 'large'
  showTooltip = true,
  withPulse = true,
}) => {
  // Size mapping
  const sizes = {
    small: 8,
    medium: 10,
    large: 12,
  };

  const dotSize = sizes[size] || sizes.small;

  // Status color mapping
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#24FF00'; // AIM Green
      case 'away':
        return '#FFA500'; // Orange
      case 'offline':
      default:
        return '#9AA5B1'; // Grey
    }
  };

  // Status text
  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        if (lastSeen) {
          return `Last seen ${formatLastSeen(lastSeen)}`;
        }
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const indicator = (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Pulsing ring for online status */}
      {status === 'online' && withPulse && (
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'absolute',
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            bgcolor: getStatusColor(),
          }}
        />
      )}

      {/* Status dot */}
      <Box
        component={motion.div}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        sx={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          bgcolor: getStatusColor(),
          border: '1.5px solid',
          borderColor: 'background.paper',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
        }}
      />
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip title={getStatusText()} arrow placement="top">
        {indicator}
      </Tooltip>
    );
  }

  return indicator;
};

export default PresenceIndicator;
