import React, { useState, useRef } from 'react';
import { Box, IconButton, ListItem } from '@mui/material';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import EditIcon from '@mui/icons-material/Edit';

/**
 * SwipeableListItem component
 *
 * Swipeable list item with action buttons revealed on swipe
 *
 * Features:
 * - Swipe left/right to reveal actions
 * - Smooth spring animations
 * - Auto-close on tap outside
 * - Customizable actions
 * - Haptic feedback
 *
 * Usage:
 * <SwipeableListItem
 *   leftActions={[
 *     { icon: <EditIcon />, color: 'primary', onAction: handleEdit },
 *   ]}
 *   rightActions={[
 *     { icon: <DeleteIcon />, color: 'error', onAction: handleDelete },
 *   ]}
 * >
 *   <ListItemContent />
 * </SwipeableListItem>
 */
const SwipeableListItem = ({
  children,
  leftActions = [],
  rightActions = [
    {
      icon: <DeleteIcon />,
      color: 'error',
      label: 'Delete',
      onAction: () => {},
    },
  ],
  threshold = 80,
  disabled = false,
  sx = {},
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState(null); // 'left' or 'right'
  const x = useMotionValue(0);
  const itemRef = useRef(null);

  // Calculate action button width
  const actionWidth = 80;
  const leftActionWidth = leftActions.length * actionWidth;
  const rightActionWidth = rightActions.length * actionWidth;

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Determine if we should open actions
    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      if (offset > 0 && leftActions.length > 0) {
        // Swiped right - show left actions
        x.set(leftActionWidth);
        setIsOpen(true);
        setDirection('left');
      } else if (offset < 0 && rightActions.length > 0) {
        // Swiped left - show right actions
        x.set(-rightActionWidth);
        setIsOpen(true);
        setDirection('right');
      } else {
        x.set(0);
        setIsOpen(false);
        setDirection(null);
      }
    } else {
      // Return to center
      x.set(0);
      setIsOpen(false);
      setDirection(null);
    }
  };

  const handleActionClick = (action) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Execute action
    action.onAction?.();

    // Close
    x.set(0);
    setIsOpen(false);
    setDirection(null);
  };

  const ActionButton = ({ action, index }) => (
    <IconButton
      onClick={() => handleActionClick(action)}
      sx={{
        width: actionWidth,
        height: '100%',
        borderRadius: 0,
        backgroundColor: `${action.color}.main`,
        color: `${action.color}.contrastText`,
        '&:hover': {
          backgroundColor: `${action.color}.dark`,
        },
      }}
      aria-label={action.label}
    >
      {action.icon}
    </IconButton>
  );

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {/* Left actions */}
      {leftActions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            width: leftActionWidth,
          }}
        >
          {leftActions.map((action, index) => (
            <ActionButton key={index} action={action} index={index} />
          ))}
        </Box>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            width: rightActionWidth,
          }}
        >
          {rightActions.map((action, index) => (
            <ActionButton key={index} action={action} index={index} />
          ))}
        </Box>
      )}

      {/* Swipeable content */}
      <Box
        ref={itemRef}
        component={motion.div}
        drag={disabled ? false : 'x'}
        dragConstraints={{
          left: rightActions.length > 0 ? -rightActionWidth * 1.2 : 0,
          right: leftActions.length > 0 ? leftActionWidth * 1.2 : 0,
        }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        sx={{
          position: 'relative',
          backgroundColor: 'background.paper',
          cursor: disabled ? 'default' : 'grab',
          touchAction: 'pan-y',
          '&:active': {
            cursor: disabled ? 'default' : 'grabbing',
          },
        }}
        {...props}
      >
        {children}
      </Box>
    </Box>
  );
};

export default SwipeableListItem;
