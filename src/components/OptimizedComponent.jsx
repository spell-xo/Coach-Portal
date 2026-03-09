import React, { memo, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * OptimizedComponent
 *
 * Example component demonstrating performance optimization techniques
 *
 * Techniques used:
 * - React.memo for preventing unnecessary re-renders
 * - useMemo for expensive calculations
 * - useCallback for stable function references
 * - Proper props comparison
 *
 * Usage:
 * <OptimizedComponent
 *   data={largeDataset}
 *   onItemClick={handleClick}
 * />
 */
const OptimizedComponent = memo(
  ({ data, onItemClick, filterText = '' }) => {
    // Memoize expensive filtering operation
    const filteredData = useMemo(() => {
      if (!filterText) return data;

      console.log('[Performance] Filtering data...'); // Only logs when filterText or data changes

      return data.filter((item) =>
        item.name.toLowerCase().includes(filterText.toLowerCase())
      );
    }, [data, filterText]);

    // Memoize expensive calculation
    const stats = useMemo(() => {
      console.log('[Performance] Calculating stats...'); // Only logs when filteredData changes

      return {
        total: filteredData.length,
        active: filteredData.filter((item) => item.active).length,
        inactive: filteredData.filter((item) => !item.active).length,
      };
    }, [filteredData]);

    // Memoize callback to prevent child re-renders
    const handleClick = useCallback(
      (item) => {
        onItemClick?.(item);
      },
      [onItemClick]
    );

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Optimized Component
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            Total: {stats.total} | Active: {stats.active} | Inactive: {stats.inactive}
          </Typography>
        </Box>

        <Box>
          {filteredData.map((item) => (
            <OptimizedListItem
              key={item.id}
              item={item}
              onClick={handleClick}
            />
          ))}
        </Box>
      </Box>
    );
  },
  // Custom comparison function for props
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.filterText === nextProps.filterText &&
      prevProps.onItemClick === nextProps.onItemClick
    );
  }
);

/**
 * OptimizedListItem
 *
 * Memoized list item component
 * Only re-renders when its specific item data changes
 */
const OptimizedListItem = memo(
  ({ item, onClick }) => {
    const handleClick = useCallback(() => {
      onClick(item);
    }, [item, onClick]);

    return (
      <Box
        onClick={handleClick}
        sx={{
          p: 2,
          mb: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Typography variant="body1">{item.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          Status: {item.active ? 'Active' : 'Inactive'}
        </Typography>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if item data changed
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.active === nextProps.item.active
    );
  }
);

OptimizedComponent.displayName = 'OptimizedComponent';
OptimizedListItem.displayName = 'OptimizedListItem';

export default OptimizedComponent;

/**
 * Performance Optimization Checklist:
 *
 * ✅ React.memo for component memoization
 * ✅ useMemo for expensive calculations
 * ✅ useCallback for stable function references
 * ✅ Custom comparison functions for precise re-render control
 * ✅ Key prop for efficient list rendering
 * ✅ Proper dependency arrays
 * ✅ Minimal prop passing
 *
 * Best Practices:
 * - Only memoize when profiling shows benefit
 * - Don't over-optimize - measure first
 * - Keep components small and focused
 * - Use React DevTools Profiler
 * - Monitor bundle size
 */
