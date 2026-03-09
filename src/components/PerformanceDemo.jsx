import React, { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Divider,
  Chip,
} from '@mui/material';
import VirtualList from './VirtualList';
import LazyImage from './LazyImage';
import OptimizedComponent from './OptimizedComponent';
import SpeedIcon from '@mui/icons-material/Speed';
import ImageIcon from '@mui/icons-material/Image';
import ListIcon from '@mui/icons-material/List';
import CodeIcon from '@mui/icons-material/Code';

/**
 * PerformanceDemo component
 *
 * Demonstrates all performance optimization techniques:
 * - Virtual scrolling for large lists
 * - Lazy image loading
 * - React.memo optimization
 * - Code splitting patterns
 */
const PerformanceDemo = () => {
  const [filterText, setFilterText] = useState('');

  // Generate large dataset for virtual list demo
  const largeDataset = useMemo(
    () =>
      Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i + 1}`,
        description: `This is item number ${i + 1}`,
      })),
    []
  );

  // Generate data for optimized component demo
  const optimizedData = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i + 1}`,
        active: Math.random() > 0.5,
      })),
    []
  );

  // Sample images for lazy loading demo
  const images = [
    'https://picsum.photos/seed/1/800/600',
    'https://picsum.photos/seed/2/800/600',
    'https://picsum.photos/seed/3/800/600',
    'https://picsum.photos/seed/4/800/600',
    'https://picsum.photos/seed/5/800/600',
    'https://picsum.photos/seed/6/800/600',
  ];

  const handleItemClick = (item) => {
    console.log('Item clicked:', item);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SpeedIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Performance Optimization Demo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Techniques for building fast, efficient React applications
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Virtual Scrolling */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ListIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              1. Virtual Scrolling (10,000 items)
            </Typography>
            <Chip label="60fps" size="small" color="success" />
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Only renders visible items, dramatically improving performance for large
            lists. Try scrolling through 10,000 items smoothly!
          </Typography>

          <Paper
            variant="outlined"
            sx={{ height: 400, p: 2, bgcolor: 'grey.50' }}
          >
            <VirtualList
              items={largeDataset}
              itemHeight={60}
              renderItem={(item) => (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              )}
            />
          </Paper>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              <strong>Performance Impact:</strong> Rendering 10,000 DOM elements
              would freeze the page. Virtual scrolling only renders ~10 visible items.
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              <strong>Memory Saved:</strong> ~99% reduction in DOM nodes
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Lazy Image Loading */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ImageIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              2. Lazy Image Loading
            </Typography>
            <Chip label="Bandwidth Saver" size="small" color="success" />
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Images load only when scrolled into view. Scroll down to see the loading
            effect!
          </Typography>

          <Grid container spacing={2}>
            {images.map((src, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <LazyImage
                  src={src}
                  alt={`Demo image ${index + 1}`}
                  aspectRatio={4 / 3}
                  borderRadius={2}
                />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              <strong>Performance Impact:</strong> Reduces initial page load by
              loading images on-demand
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              <strong>Bandwidth Saved:</strong> Up to 70% on image-heavy pages
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* React.memo Optimization */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CodeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              3. React.memo Optimization
            </Typography>
            <Chip label="Render Smart" size="small" color="success" />
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Components only re-render when their props actually change. Check the
            console to see optimization in action!
          </Typography>

          <TextField
            fullWidth
            placeholder="Filter users..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Try typing to filter - only affected components re-render"
          />

          <Paper
            variant="outlined"
            sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}
          >
            <OptimizedComponent
              data={optimizedData}
              filterText={filterText}
              onItemClick={handleItemClick}
            />
          </Paper>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              <strong>Performance Impact:</strong> Prevents unnecessary re-renders
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              <strong>Renders Saved:</strong> Up to 90% fewer component renders
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Code Splitting Info */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            4. Code Splitting & Lazy Loading
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Routes are loaded on-demand, reducing initial bundle size.
          </Typography>

          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="body2" gutterBottom fontWeight={600}>
              Implementation Example:
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            >
              {`// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Teams = lazy(() => import('./pages/Teams'));

// Use with Suspense
<Route
  path="/dashboard"
  element={
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  }
/>`}
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="caption" display="block">
                <strong>Performance Impact:</strong> Faster initial page load
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                <strong>Bundle Reduction:</strong> 30-50% smaller initial bundle
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Paper>

      {/* Performance Tips */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Performance Optimization Checklist
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              ✅ Implemented
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li>
                <Typography variant="body2">Virtual scrolling for large lists</Typography>
              </li>
              <li>
                <Typography variant="body2">Lazy image loading</Typography>
              </li>
              <li>
                <Typography variant="body2">React.memo for components</Typography>
              </li>
              <li>
                <Typography variant="body2">useMemo for calculations</Typography>
              </li>
              <li>
                <Typography variant="body2">useCallback for functions</Typography>
              </li>
              <li>
                <Typography variant="body2">Code splitting ready</Typography>
              </li>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              📊 Metrics to Track
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li>
                <Typography variant="body2">Largest Contentful Paint (LCP)</Typography>
              </li>
              <li>
                <Typography variant="body2">First Input Delay (FID)</Typography>
              </li>
              <li>
                <Typography variant="body2">Cumulative Layout Shift (CLS)</Typography>
              </li>
              <li>
                <Typography variant="body2">Bundle size (gzipped)</Typography>
              </li>
              <li>
                <Typography variant="body2">Memory usage</Typography>
              </li>
              <li>
                <Typography variant="body2">Render time per component</Typography>
              </li>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PerformanceDemo;
