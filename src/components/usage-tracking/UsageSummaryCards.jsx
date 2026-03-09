import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const formatNumber = (num) => {
  if (num == null) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCost = (amount) => {
  if (amount == null) return '$0.00';
  return `$${amount.toFixed(2)}`;
};

const StatCard = ({ title, value, color }) => (
  <Paper sx={{ p: 3, flex: 1, minWidth: 180 }}>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" sx={{ fontWeight: 700, color: color || 'text.primary' }}>
      {value}
    </Typography>
  </Paper>
);

const UsageSummaryCards = ({ summary }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <StatCard
        title="Total Tokens"
        value={formatNumber(summary?.total_tokens)}
        color="primary.main"
      />
      <StatCard
        title="Messages"
        value={formatNumber(summary?.message_count)}
        color="info.main"
      />
      <StatCard
        title="API Calls"
        value={formatNumber(summary?.api_calls)}
        color="warning.main"
      />
      <StatCard
        title="Estimated Cost"
        value={formatCost(summary?.estimated_cost_usd)}
        color="success.main"
      />
    </Box>
  );
};

export default UsageSummaryCards;
