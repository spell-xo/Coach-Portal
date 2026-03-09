import React, { useEffect } from 'react';
import { Box, IconButton, Typography, Divider } from '@mui/material';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import useFocusTrap from '../hooks/useFocusTrap';

/**
 * BottomSheet component
 *
 * Mobile-optimized modal that slides up from bottom
 *
 * Features:
 * - Swipe down to dismiss
 * - Snap points (collapsed/expanded)
 * - Backdrop with blur effect
 * - Focus trap for accessibility
 * - Prevent body scroll when open
 * - Keyboard support (Escape to close)
 *
 * Usage:
 * <BottomSheet
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Options"
 *   snapPoints={[0.5, 0.9]}
 * >
 *   <YourContent />
 * </BottomSheet>
 */
const BottomSheet = ({
  open = false,
  onClose,
  title,
  children,
  snapPoints = [0.6, 0.9], // Percentage of viewport height
  showDragHandle = true,
  showCloseButton = true,
  sx = {},
}) => {
  const sheetRef = useFocusTrap(open);
  const [snapIndex, setSnapIndex] = React.useState(0);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [open]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleDragEnd = (event, info) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Swipe down to close
    if (velocity > 500 || offset > 100) {
      onClose?.();
    } else if (velocity < -500) {
      // Swipe up to expand
      setSnapIndex(Math.min(snapIndex + 1, snapPoints.length - 1));
    }
  };

  const currentSnapPoint = snapPoints[snapIndex] || snapPoints[0];
  const sheetHeight = `${currentSnapPoint * 100}vh`;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            sx={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 1300,
            }}
          />

          {/* Bottom Sheet */}
          <Box
            ref={sheetRef}
            component={motion.div}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: sheetHeight,
              maxHeight: '90vh',
              backgroundColor: 'background.paper',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
              zIndex: 1301,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              ...sx,
            }}
          >
            {/* Drag handle */}
            {showDragHandle && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 1,
                  cursor: 'grab',
                  touchAction: 'none',
                  '&:active': {
                    cursor: 'grabbing',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 4,
                    backgroundColor: 'divider',
                    borderRadius: 2,
                  }}
                />
              </Box>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 2,
                    paddingTop: showDragHandle ? 0 : 2,
                  }}
                >
                  {title && (
                    <Typography
                      id="bottom-sheet-title"
                      variant="h6"
                      sx={{ fontWeight: 600 }}
                    >
                      {title}
                    </Typography>
                  )}
                  {showCloseButton && (
                    <IconButton
                      onClick={onClose}
                      aria-label="Close"
                      sx={{
                        marginLeft: 'auto',
                        minWidth: 44,
                        minHeight: 44,
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
                <Divider />
              </>
            )}

            {/* Content */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: 2,
              }}
            >
              {children}
            </Box>
          </Box>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
