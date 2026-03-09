import React, { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * PullToRefresh component
 *
 * Implements pull-to-refresh pattern for mobile
 *
 * Features:
 * - Smooth drag interaction
 * - Visual feedback with icon rotation
 * - Customizable refresh threshold
 * - Haptic feedback support (when available)
 * - Auto-reset after refresh
 *
 * Usage:
 * const [refreshing, setRefreshing] = useState(false);
 *
 * const handleRefresh = async () => {
 *   setRefreshing(true);
 *   await fetchData();
 *   setRefreshing(false);
 * };
 *
 * <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
 *   <YourContent />
 * </PullToRefresh>
 */
const PullToRefresh = ({
  children,
  onRefresh,
  refreshing = false,
  threshold = 80,
  disabled = false,
  sx = {},
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const pullDistance = useMotionValue(0);
  const containerRef = useRef(null);

  // Transform pull distance to rotation for icon
  const iconRotation = useTransform(pullDistance, [0, threshold], [0, 360]);

  // Transform pull distance to opacity
  const iconOpacity = useTransform(pullDistance, [0, threshold], [0.3, 1]);

  const handleTouchStart = (e) => {
    if (disabled || refreshing) return;

    const touch = e.touches[0];
    const scrollTop = containerRef.current?.scrollTop || 0;

    // Only enable pull-to-refresh at the top
    if (scrollTop === 0) {
      setStartY(touch.clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || disabled || refreshing) return;

    const touch = e.touches[0];
    const distance = touch.clientY - startY;

    if (distance > 0) {
      // Apply resistance curve
      const resistance = Math.min(distance * 0.5, threshold * 1.5);
      pullDistance.set(resistance);

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling || disabled || refreshing) return;

    const distance = pullDistance.get();

    if (distance >= threshold) {
      // Trigger refresh
      if (onRefresh) {
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        onRefresh();
      }
    }

    // Reset
    setIsPulling(false);
    pullDistance.set(0);
  };

  useEffect(() => {
    if (!refreshing) {
      pullDistance.set(0);
    }
  }, [refreshing, pullDistance]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        ...sx,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <Box
        component={motion.div}
        style={{
          y: pullDistance,
          opacity: isPulling || refreshing ? 1 : 0,
        }}
        sx={{
          position: 'absolute',
          top: -60,
          left: 0,
          right: 0,
          height: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          zIndex: 1,
        }}
      >
        {refreshing ? (
          <>
            <CircularProgress size={24} />
            <Typography variant="caption" color="text.secondary">
              Refreshing...
            </Typography>
          </>
        ) : (
          <>
            <Box
              component={motion.div}
              style={{
                rotate: iconRotation,
                opacity: iconOpacity,
              }}
            >
              <RefreshIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {pullDistance.get() >= threshold ? 'Release to refresh' : 'Pull to refresh'}
            </Typography>
          </>
        )}
      </Box>

      {/* Content */}
      <Box
        component={motion.div}
        style={{
          y: refreshing ? 60 : pullDistance,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PullToRefresh;
