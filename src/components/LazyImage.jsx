import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Box, Skeleton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LazyImage component
 *
 * Lazy-loads images only when they enter the viewport
 * Reduces initial page load time and bandwidth usage
 *
 * Features:
 * - Intersection Observer for lazy loading
 * - Skeleton placeholder during load
 * - Smooth fade-in animation
 * - Error state handling
 * - Responsive image support
 *
 * Usage:
 * <LazyImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   aspectRatio={16/9}
 * />
 */
const LazyImage = ({
  src,
  alt = '',
  aspectRatio = 16 / 9,
  objectFit = 'cover',
  borderRadius = 0,
  placeholder = null,
  onLoad,
  onError,
  sx = {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.01,
    rootMargin: '50px',
  });

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        width: '100%',
        paddingBottom: `${(1 / aspectRatio) * 100}%`,
        overflow: 'hidden',
        borderRadius: borderRadius,
        bgcolor: 'grey.100',
        ...sx,
      }}
      {...props}
    >
      {/* Skeleton Placeholder */}
      {!isLoaded && !hasError && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Error State */}
      {hasError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200',
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          Failed to load image
        </Box>
      )}

      {/* Actual Image */}
      <AnimatePresence>
        {inView && !hasError && (
          <Box
            component={motion.img}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: objectFit,
            }}
          />
        )}
      </AnimatePresence>

      {/* Custom Placeholder */}
      {placeholder && !isLoaded && !hasError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {placeholder}
        </Box>
      )}
    </Box>
  );
};

export default LazyImage;
