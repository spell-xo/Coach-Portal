import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import BarChartIcon from '@mui/icons-material/BarChart';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';

const ClubAnalytics = () => {
  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Club performance and engagement metrics
          </Typography>
        </Box>

        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            textAlign: 'center',
          }}
        >
          <BarChartIcon
            sx={{
              fontSize: 80,
              color: 'text.secondary',
              mb: 3,
              opacity: 0.5,
            }}
          />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
            We're working on powerful analytics features to help you track club performance,
            player engagement, and training progress. Stay tuned!
          </Typography>
        </Paper>
      </Container>
    </AppLayout>
  );
};

export default ClubAnalytics;
