import React, { Suspense } from 'react';
import { Box, CircularProgress, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * Loading fallback component for lazy-loaded routes
 */
export const RouteLoadingFallback = ({ variant = 'circular' }) => {
  if (variant === 'linear') {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <CircularProgress size={40} />
    </Box>
  );
};

/**
 * LazyRoute component
 *
 * Wrapper for lazy-loaded route components with Suspense
 *
 * Features:
 * - Code splitting for route-level chunks
 * - Loading fallback during chunk download
 * - Error boundary support
 * - Smooth transitions
 *
 * Usage with React Router:
 * const Dashboard = lazy(() => import('./pages/Dashboard'));
 *
 * <Route
 *   path="/dashboard"
 *   element={
 *     <LazyRoute>
 *       <Dashboard />
 *     </LazyRoute>
 *   }
 * />
 */
const LazyRoute = ({
  children,
  fallback = <RouteLoadingFallback />,
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

/**
 * Utility function to create lazy-loaded routes
 *
 * Usage:
 * const routes = [
 *   createLazyRoute('/dashboard', () => import('./pages/Dashboard')),
 *   createLazyRoute('/teams', () => import('./pages/Teams')),
 * ];
 */
export const createLazyRoute = (path, importFunc, options = {}) => {
  const LazyComponent = React.lazy(importFunc);

  return {
    path,
    element: (
      <LazyRoute fallback={options.fallback}>
        <LazyComponent />
      </LazyRoute>
    ),
    ...options,
  };
};

export default LazyRoute;
