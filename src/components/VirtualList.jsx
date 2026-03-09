import React from 'react';
import { FixedSizeList, VariableSizeList } from 'react-window';
import { Box, CircularProgress } from '@mui/material';
import AutoSizer from 'react-virtualized-auto-sizer';

/**
 * VirtualList component
 *
 * High-performance virtualized list for rendering large datasets
 * Only renders visible items, dramatically improving performance
 *
 * Features:
 * - Fixed or variable item heights
 * - Auto-sizing to parent container
 * - Smooth scrolling
 * - Minimal memory footprint
 * - Loading state support
 *
 * Usage:
 * <VirtualList
 *   items={largeArray}
 *   itemHeight={60}
 *   renderItem={(item, index) => <div>{item.name}</div>}
 * />
 */
const VirtualList = ({
  items = [],
  itemHeight = 60,
  variableHeight = false,
  getItemHeight,
  renderItem,
  loading = false,
  overscanCount = 3,
  sx = {},
}) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          ...sx,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const Row = ({ index, style }) => {
    const item = items[index];
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    );
  };

  const ListComponent = variableHeight ? VariableSizeList : FixedSizeList;

  return (
    <Box sx={{ height: '100%', width: '100%', ...sx }}>
      <AutoSizer>
        {({ height, width }) => (
          <ListComponent
            height={height}
            itemCount={items.length}
            itemSize={variableHeight ? getItemHeight : itemHeight}
            width={width}
            overscanCount={overscanCount}
          >
            {Row}
          </ListComponent>
        )}
      </AutoSizer>
    </Box>
  );
};

export default VirtualList;
